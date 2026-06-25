from dotenv import load_dotenv
from pathlib import Path

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / ".env")

import os
import logging
import secrets
from datetime import datetime, timezone, timedelta
from typing import List, Optional

import bcrypt
import jwt
from bson import ObjectId
from fastapi import FastAPI, APIRouter, Request, Response, HTTPException, Depends
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel, EmailStr, Field

import llm
from examples import EXAMPLES

# ---------------------------------------------------------------------------
# Database
# ---------------------------------------------------------------------------
mongo_url = os.environ["MONGO_URL"]
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ["DB_NAME"]]

JWT_ALGORITHM = "HS256"

app = FastAPI()
api_router = APIRouter(prefix="/api")

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s")
logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# Auth helpers
# ---------------------------------------------------------------------------
def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def verify_password(plain: str, hashed: str) -> bool:
    return bcrypt.checkpw(plain.encode("utf-8"), hashed.encode("utf-8"))


def get_jwt_secret() -> str:
    return os.environ["JWT_SECRET"]


def create_access_token(user_id: str, email: str) -> str:
    payload = {
        "sub": user_id,
        "email": email,
        "exp": datetime.now(timezone.utc) + timedelta(minutes=15),
        "type": "access",
    }
    return jwt.encode(payload, get_jwt_secret(), algorithm=JWT_ALGORITHM)


def create_refresh_token(user_id: str) -> str:
    payload = {
        "sub": user_id,
        "exp": datetime.now(timezone.utc) + timedelta(days=7),
        "type": "refresh",
    }
    return jwt.encode(payload, get_jwt_secret(), algorithm=JWT_ALGORITHM)


def set_auth_cookies(response: Response, user_id: str, email: str):
    access = create_access_token(user_id, email)
    refresh = create_refresh_token(user_id)
    response.set_cookie("access_token", access, httponly=True, secure=True, samesite="none", max_age=900, path="/")
    response.set_cookie("refresh_token", refresh, httponly=True, secure=True, samesite="none", max_age=604800, path="/")


async def get_current_user(request: Request) -> dict:
    token = request.cookies.get("access_token")
    if not token:
        auth_header = request.headers.get("Authorization", "")
        if auth_header.startswith("Bearer "):
            token = auth_header[7:]
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    try:
        payload = jwt.decode(token, get_jwt_secret(), algorithms=[JWT_ALGORITHM])
        if payload.get("type") != "access":
            raise HTTPException(status_code=401, detail="Invalid token type")
        user = await db.users.find_one({"_id": ObjectId(payload["sub"])})
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        user["id"] = str(user["_id"])
        user.pop("_id", None)
        user.pop("password_hash", None)
        return user
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")


# ---------------------------------------------------------------------------
# Models
# ---------------------------------------------------------------------------
class RegisterInput(BaseModel):
    email: EmailStr
    password: str = Field(min_length=6)
    name: Optional[str] = ""


class LoginInput(BaseModel):
    email: EmailStr
    password: str


class ForgotInput(BaseModel):
    email: EmailStr


class ResetInput(BaseModel):
    token: str
    password: str = Field(min_length=6)


class Solution(BaseModel):
    title: str = ""
    description: str = ""
    needs_satisfied_a: List[str] = []
    needs_satisfied_b: List[str] = []
    needs_unaddressed: List[str] = []
    improvements: str = ""


class Reflection(BaseModel):
    promising: str = ""
    unmet: str = ""
    improve: str = ""
    changed: str = ""


class IssueMapInput(BaseModel):
    title: str = ""
    issue: str = ""
    position_a: str = ""
    position_b: str = ""
    concerns_a: str = ""
    needs_a: List[str] = []
    needs_b: List[str] = []
    solutions: List[Solution] = []
    reflection: Reflection = Reflection()


# LLM request models
class OpposingInput(BaseModel):
    issue: str
    position_a: str


class ConcernsInput(BaseModel):
    issue: str
    position: str


class NeedsInput(BaseModel):
    issue: str
    position_a: str
    position_b: str
    concerns_a: str = ""


class SolutionsInput(BaseModel):
    issue: str
    position_a: str
    position_b: str
    needs_a: List[str]
    needs_b: List[str]


# ---------------------------------------------------------------------------
# Auth routes
# ---------------------------------------------------------------------------
@api_router.post("/auth/register")
async def register(data: RegisterInput, response: Response):
    email = data.email.lower()
    if await db.users.find_one({"email": email}):
        raise HTTPException(status_code=400, detail="An account with this email already exists.")
    doc = {
        "email": email,
        "password_hash": hash_password(data.password),
        "name": data.name or email.split("@")[0],
        "role": "user",
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    result = await db.users.insert_one(doc)
    uid = str(result.inserted_id)
    set_auth_cookies(response, uid, email)
    return {"id": uid, "email": email, "name": doc["name"], "role": "user"}


@api_router.post("/auth/login")
async def login(data: LoginInput, response: Response, request: Request):
    email = data.email.lower()
    identifier = f"{request.client.host}:{email}"
    attempt = await db.login_attempts.find_one({"identifier": identifier})
    if attempt and attempt.get("count", 0) >= 5:
        locked_until = attempt.get("locked_until")
        if locked_until and datetime.now(timezone.utc) < datetime.fromisoformat(locked_until):
            raise HTTPException(status_code=429, detail="Too many failed attempts. Try again later.")

    user = await db.users.find_one({"email": email})
    if not user or not verify_password(data.password, user["password_hash"]):
        new_count = (attempt.get("count", 0) if attempt else 0) + 1
        update = {"count": new_count}
        if new_count >= 5:
            update["locked_until"] = (datetime.now(timezone.utc) + timedelta(minutes=15)).isoformat()
        await db.login_attempts.update_one({"identifier": identifier}, {"$set": update}, upsert=True)
        raise HTTPException(status_code=401, detail="Invalid email or password.")

    await db.login_attempts.delete_one({"identifier": identifier})
    uid = str(user["_id"])
    set_auth_cookies(response, uid, email)
    return {"id": uid, "email": email, "name": user.get("name", ""), "role": user.get("role", "user")}


@api_router.post("/auth/logout")
async def logout(response: Response, current=Depends(get_current_user)):
    response.delete_cookie("access_token", path="/")
    response.delete_cookie("refresh_token", path="/")
    return {"ok": True}


@api_router.get("/auth/me")
async def me(current=Depends(get_current_user)):
    return current


@api_router.post("/auth/forgot-password")
async def forgot_password(data: ForgotInput):
    email = data.email.lower()
    user = await db.users.find_one({"email": email})
    if not user:
        # Do not reveal whether an account exists.
        return {"ok": True, "reset_token": None}
    token = secrets.token_urlsafe(32)
    await db.password_reset_tokens.insert_one({
        "token": token,
        "user_id": str(user["_id"]),
        "expires_at": datetime.now(timezone.utc) + timedelta(hours=1),
        "used": False,
    })
    logger.info(f"Password reset requested for {email}. Reset token: {token}")
    # No email service configured, so return the token to drive the reset flow in-app.
    return {"ok": True, "reset_token": token}


@api_router.post("/auth/reset-password")
async def reset_password(data: ResetInput):
    rec = await db.password_reset_tokens.find_one({"token": data.token})
    if not rec or rec.get("used"):
        raise HTTPException(status_code=400, detail="This reset link is invalid or has already been used.")
    exp = rec["expires_at"]
    if exp.tzinfo is None:
        exp = exp.replace(tzinfo=timezone.utc)
    if datetime.now(timezone.utc) > exp:
        raise HTTPException(status_code=400, detail="This reset link has expired. Please request a new one.")
    await db.users.update_one({"_id": ObjectId(rec["user_id"])}, {"$set": {"password_hash": hash_password(data.password)}})
    await db.password_reset_tokens.update_one({"_id": rec["_id"]}, {"$set": {"used": True}})
    return {"ok": True}


@api_router.post("/auth/refresh")
async def refresh(request: Request, response: Response):
    token = request.cookies.get("refresh_token")
    if not token:
        raise HTTPException(status_code=401, detail="No refresh token")
    try:
        payload = jwt.decode(token, get_jwt_secret(), algorithms=[JWT_ALGORITHM])
        if payload.get("type") != "refresh":
            raise HTTPException(status_code=401, detail="Invalid token type")
        user = await db.users.find_one({"_id": ObjectId(payload["sub"])})
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        set_auth_cookies(response, str(user["_id"]), user["email"])
        return {"ok": True}
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")


# ---------------------------------------------------------------------------
# LLM routes
# ---------------------------------------------------------------------------
@api_router.post("/ai/opposing-position")
async def ai_opposing(data: OpposingInput, current=Depends(get_current_user)):
    try:
        return {"opposing_position": await llm.generate_opposing_position(data.issue, data.position_a)}
    except Exception as e:
        logger.exception("opposing failed")
        raise HTTPException(status_code=500, detail=f"AI generation failed: {e}")


@api_router.post("/ai/concerns")
async def ai_concerns(data: ConcernsInput, current=Depends(get_current_user)):
    try:
        return {"suggestions": await llm.suggest_concerns(data.issue, data.position)}
    except Exception as e:
        logger.exception("concerns failed")
        raise HTTPException(status_code=500, detail=f"AI generation failed: {e}")


@api_router.post("/ai/needs")
async def ai_needs(data: NeedsInput, current=Depends(get_current_user)):
    try:
        return await llm.generate_needs(data.issue, data.position_a, data.position_b, data.concerns_a)
    except Exception as e:
        logger.exception("needs failed")
        raise HTTPException(status_code=500, detail=f"AI generation failed: {e}")


@api_router.post("/ai/solutions")
async def ai_solutions(data: SolutionsInput, current=Depends(get_current_user)):
    try:
        return {"solutions": await llm.generate_solutions(data.issue, data.position_a, data.position_b, data.needs_a, data.needs_b)}
    except Exception as e:
        logger.exception("solutions failed")
        raise HTTPException(status_code=500, detail=f"AI generation failed: {e}")


# ---------------------------------------------------------------------------
# Issue map CRUD
# ---------------------------------------------------------------------------
def _serialize_map(doc: dict) -> dict:
    doc["id"] = str(doc.pop("_id"))
    return doc


def _oid(map_id: str) -> ObjectId:
    try:
        return ObjectId(map_id)
    except Exception:
        raise HTTPException(status_code=404, detail="Issue map not found")


@api_router.get("/examples")
async def get_examples():
    return EXAMPLES


@api_router.get("/maps")
async def list_maps(current=Depends(get_current_user)):
    docs = await db.issue_maps.find({"user_id": current["id"]}).sort("updated_at", -1).to_list(500)
    return [_serialize_map(d) for d in docs]


@api_router.post("/maps")
async def create_map(data: IssueMapInput, current=Depends(get_current_user)):
    now = datetime.now(timezone.utc).isoformat()
    doc = data.model_dump()
    doc.update({"user_id": current["id"], "created_at": now, "updated_at": now})
    result = await db.issue_maps.insert_one(doc)
    doc["_id"] = result.inserted_id
    return _serialize_map(doc)


@api_router.get("/maps/{map_id}")
async def get_map(map_id: str, current=Depends(get_current_user)):
    doc = await db.issue_maps.find_one({"_id": _oid(map_id), "user_id": current["id"]})
    if not doc:
        raise HTTPException(status_code=404, detail="Issue map not found")
    return _serialize_map(doc)


@api_router.put("/maps/{map_id}")
async def update_map(map_id: str, data: IssueMapInput, current=Depends(get_current_user)):
    doc = data.model_dump()
    doc["updated_at"] = datetime.now(timezone.utc).isoformat()
    result = await db.issue_maps.update_one(
        {"_id": _oid(map_id), "user_id": current["id"]}, {"$set": doc}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Issue map not found")
    updated = await db.issue_maps.find_one({"_id": _oid(map_id)})
    return _serialize_map(updated)


@api_router.delete("/maps/{map_id}")
async def delete_map(map_id: str, current=Depends(get_current_user)):
    result = await db.issue_maps.delete_one({"_id": _oid(map_id), "user_id": current["id"]})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Issue map not found")
    return {"ok": True}


@api_router.get("/")
async def root():
    return {"message": "Collaborative Democracy Lab API"}


# ---------------------------------------------------------------------------
# Startup
# ---------------------------------------------------------------------------
@app.on_event("startup")
async def startup():
    await db.users.create_index("email", unique=True)
    await db.login_attempts.create_index("identifier")
    await db.issue_maps.create_index("user_id")
    await db.password_reset_tokens.create_index("expires_at", expireAfterSeconds=0)

    admin_email = os.environ.get("ADMIN_EMAIL", "admin@example.com")
    admin_password = os.environ.get("ADMIN_PASSWORD", "admin123")
    existing = await db.users.find_one({"email": admin_email})
    if existing is None:
        await db.users.insert_one({
            "email": admin_email,
            "password_hash": hash_password(admin_password),
            "name": "Admin",
            "role": "admin",
            "created_at": datetime.now(timezone.utc).isoformat(),
        })
    elif not verify_password(admin_password, existing["password_hash"]):
        await db.users.update_one({"email": admin_email}, {"$set": {"password_hash": hash_password(admin_password)}})


@app.on_event("shutdown")
async def shutdown():
    client.close()


app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=[os.environ.get("FRONTEND_URL", "http://localhost:3000"), "http://localhost:3000"],
    allow_methods=["*"],
    allow_headers=["*"],
)
