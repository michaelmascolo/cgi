# Auth Testing Playbook (Collaborative Democracy Lab)

Admin: admin@democracylab.app / DemocracyLab2026!

## API
curl -c cookies.txt -X POST $URL/api/auth/login -H "Content-Type: application/json" -d '{"email":"admin@democracylab.app","password":"DemocracyLab2026!"}'
curl -b cookies.txt $URL/api/auth/me

Login returns user object and sets access_token + refresh_token cookies.
Register: POST /api/auth/register {email,password,name}.
Protected routes (/api/maps, /api/ai/*) require the access_token cookie.
