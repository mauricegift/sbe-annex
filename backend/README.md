# SBE Annex — Backend

FastAPI backend for the SBE Annex academic learning platform.

> **Full setup guides, database configuration, and deployment documentation are in the [main monorepo README](https://github.com/mauricegift/sbe-annex#readme).**

## Quick Start

```bash
git clone https://github.com/mauricegift/sbe-annex.git
cd sbe-annex/backend
python3 -m venv venv && source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env   # fill in your values
python app.py
```

API: http://localhost:3192  
Interactive docs: http://localhost:3192/docs

## Stack

- **FastAPI** — async Python web framework
- **Motor** — async MongoDB driver
- **Pydantic v1** — data validation and serialisation
- **JWT (HS256)** — stateless authentication
- **Resend** — transactional email delivery
- **SMSS** — Any SMS API for SMS OTP delivery (Kenya)

## Key Endpoints

| Prefix | Description |
|---|---|
| `POST /api/auth/register` | Register (first user becomes Super Admin) |
| `POST /api/auth/login` | Login → JWT token |
| `GET /api/user/profile` | Get current user profile |
| `GET /api/notes` | Browse approved notes |
| `GET /api/past-papers` | Browse approved past papers |
| `GET /api/groups` | List study groups |
| `GET /api/admin/*` | Admin management endpoints |

## Environment Variables

See [`.env.example`](.env.example) for a complete list with descriptions.  
Minimum required: `MONGO_URL`, `SECRET_KEY`, `RESEND_API_KEY`.

## See Also

- [Full documentation & deployment guide](https://github.com/mauricegift/sbe-annex)
- [Frontend source](https://github.com/mauricegift/sbe-annex/tree/main/frontend)
