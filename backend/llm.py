import os
import json
import re
import uuid
from emergentintegrations.llm.chat import LlmChat, UserMessage

MODEL_PROVIDER = "anthropic"
MODEL_NAME = "claude-sonnet-4-6"

SYSTEM = (
    "You are the facilitator for the Collaborative Democracy Lab. Your purpose is to help "
    "people move beneath political positions to discover the legitimate human needs underneath "
    "them, and to generate integrative solutions.\n\n"
    "Strict principles you must always follow:\n"
    "- Be rigorously nonpartisan. Never say which position is correct.\n"
    "- Never demonize, mock, or caricature either side.\n"
    "- Always frame needs positively and humanely. Translate hostile framings into legitimate "
    "underlying needs (e.g. 'they hate immigrants' -> 'they want cultural continuity, social "
    "cohesion, public safety, and economic stability').\n"
    "- Clearly distinguish positions (what people say they want) from needs (the deeper human "
    "concerns, fears, values, and hopes).\n"
    "- Solutions must be novel and integrative, aiming to satisfy needs from BOTH sides. They "
    "must NOT simply split the difference or be a bland compromise.\n\n"
    "You always respond with STRICT, VALID JSON only. No prose, no markdown, no code fences."
)


def _parse_json(text: str):
    text = text.strip()
    fence = re.search(r"```(?:json)?\s*(.*?)```", text, re.S)
    if fence:
        text = fence.group(1).strip()
    start = min(
        [i for i in [text.find("{"), text.find("[")] if i != -1],
        default=0,
    )
    text = text[start:]
    # trim to last closing bracket
    last = max(text.rfind("}"), text.rfind("]"))
    if last != -1:
        text = text[: last + 1]
    return json.loads(text)


async def _ask(prompt: str):
    chat = LlmChat(
        api_key=os.environ["EMERGENT_LLM_KEY"],
        session_id=f"cdl-{uuid.uuid4()}",
        system_message=SYSTEM,
    ).with_model(MODEL_PROVIDER, MODEL_NAME)
    resp = await chat.send_message(UserMessage(text=prompt))
    return _parse_json(resp)


async def generate_opposing_position(issue: str, position_a: str) -> str:
    prompt = (
        f'Issue: "{issue}"\n'
        f'A person holds this position: "{position_a}"\n\n'
        "Write the position that thoughtful people on the other side of this issue usually hold. "
        "Make it fair, steel-manned, and respectful (the strongest honest version of their view). "
        "1-3 sentences.\n\n"
        'Respond as JSON: {"opposing_position": "..."}'
    )
    data = await _ask(prompt)
    return data.get("opposing_position", "").strip()


async def suggest_concerns(issue: str, position: str) -> list:
    prompt = (
        f'Issue: "{issue}"\n'
        f'Position: "{position}"\n\n'
        "Suggest 4-6 concerns, fears, values, or hopes that might genuinely sit behind this "
        "position. Frame each humanely and in the first person voice of someone holding the "
        "position (e.g. 'I worry that...', 'I value...').\n\n"
        'Respond as JSON: {"suggestions": ["...", "..."]}'
    )
    data = await _ask(prompt)
    return data.get("suggestions", [])


async def generate_needs(issue: str, position_a: str, position_b: str, concerns_a: str = "") -> dict:
    prompt = (
        f'Issue: "{issue}"\n'
        f'Position A (the user\'s position): "{position_a}"\n'
        f'Position B (the opposing position): "{position_b}"\n'
        + (f'Stated concerns behind Position A: "{concerns_a}"\n' if concerns_a else "")
        + "\nFor EACH position, identify 3-5 underlying human needs. Needs must be short noun "
        "phrases (2-6 words), framed positively and humanely, never as attacks. They describe "
        "what the person fundamentally wants protected or fulfilled.\n\n"
        'Respond as JSON: {"needs_a": ["...", "..."], "needs_b": ["...", "..."]}'
    )
    data = await _ask(prompt)
    return {
        "needs_a": data.get("needs_a", []),
        "needs_b": data.get("needs_b", []),
    }


async def generate_solutions(issue: str, position_a: str, position_b: str, needs_a: list, needs_b: list) -> list:
    prompt = (
        f'Issue: "{issue}"\n'
        f'Position A: "{position_a}"\n'
        f'Position B: "{position_b}"\n'
        f"Needs behind Position A: {json.dumps(needs_a)}\n"
        f"Needs behind Position B: {json.dumps(needs_b)}\n\n"
        "Generate 3-5 NOVEL, INTEGRATIVE solutions that try to satisfy needs from BOTH sides at "
        "once. Do not simply split the difference or compromise. Aim for creative win-win designs "
        "that neither side's original position alone achieves.\n\n"
        "Each solution must include:\n"
        "- title: short compelling name\n"
        "- description: 2-4 sentence explanation\n"
        "- needs_satisfied_a: list of needs from Position A it addresses\n"
        "- needs_satisfied_b: list of needs from Position B it addresses\n"
        "- needs_unaddressed: list of needs not yet fully addressed\n"
        "- improvements: 1-2 sentences on how it could be improved\n\n"
        'Respond as JSON: {"solutions": [{"title": "...", "description": "...", '
        '"needs_satisfied_a": [], "needs_satisfied_b": [], "needs_unaddressed": [], '
        '"improvements": "..."}]}'
    )
    data = await _ask(prompt)
    return data.get("solutions", [])
