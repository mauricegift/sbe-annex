# SBE Annex — Academic Learning Platform

> Full-stack academic resources platform for SBE (School of Business and Economics) students.  
> Upload & download lecture notes, past exam papers, read blogs, and manage study groups — all in one place.

**Live demo:** https://bbm.giftedtech.co.ke  
**API:** https://bbmback.giftedtech.co.ke/docs

---

## Table of Contents

1. [Project Overview](#project-overview)
2. [Tech Stack](#tech-stack)
3. [Repository Structure](#repository-structure)
4. [Features](#features)
5. [Prerequisites](#prerequisites)
6. [Database Setup](#database-setup)
   - [Option A — MongoDB Atlas (Cloud, Free)](#option-a--mongodb-atlas-cloud-free)
   - [Option B — Local MongoDB (VPS / Self-Hosted)](#option-b--local-mongodb-vps--self-hosted)
7. [Local Development](#local-development)
   - [Backend](#backend-local-setup)
   - [Frontend](#frontend-local-setup)
8. [Environment Variables Reference](#environment-variables-reference)
   - [Backend `.env`](#backend-env)
   - [Frontend `.env`](#frontend-env)
9. [Deployment](#deployment)
   - [Frontend — Vercel](#frontend--vercel)
   - [Backend — Railway](#backend--railway)
   - [Backend — Render](#backend--render)
   - [Backend — Heroku](#backend--heroku)
   - [Backend — VPS (Ubuntu)](#backend--vps-ubuntu)
10. [API Overview](#api-overview)
11. [First-Time Setup (Super Admin)](#first-time-setup-super-admin)
12. [Contributing](#contributing)

---

## Project Overview

SBE Annex (formerly BBM Annex) is a full-stack web application that serves as a central repository for academic content. Students can upload notes and past papers, which are then reviewed by admins before being published. The platform supports:

- Email and SMS-based account verification
- Role-based access control (Student → Admin → Super Admin)
- Study group and specialization management
- Blog / announcement system
- Dark/light mode

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 18 + Vite, TypeScript, Tailwind CSS, shadcn/ui |
| **Backend** | FastAPI (Python 3.11+), Pydantic v1 |
| **Database** | MongoDB (motor async driver) |
| **Auth** | JWT (HS256) — Bearer tokens |
| **Email** | Resend API |
| **SMS** | ANY SMS API (Kenya) |
| **File storage** | GitHub CDN (raw.githubusercontent.com) |
| **Frontend hosting** | Vercel |
| **Backend hosting** | VPS / Railway / Render / Heroku |

---

## Repository Structure

```
sbe-annex/
├── backend/                        # FastAPI backend
│   ├── app.py                      # Application entry point, middleware, router registration
│   ├── requirements.txt            # Python dependencies
│   ├── gunicorn_conf.py            # Gunicorn production config
│   ├── Dockerfile                  # Docker support
│   ├── docker-compose.yml          # Docker Compose (app + MongoDB)
│   ├── start.sh                    # VPS startup script
│   ├── .env.example                # Environment variable template
│   ├── db/
│   │   └── database.py             # MongoDB async connection
│   ├── models/                     # Pydantic request/response models
│   │   ├── user.py
│   │   ├── document.py             # Notes and past papers models
│   │   ├── blog.py
│   │   ├── group.py
│   │   └── review.py
│   ├── lib/
│   │   ├── security.py             # Password hashing, JWT encode/decode
│   │   └── tokens.py               # Token creation helpers
│   ├── helpers/
│   │   ├── auth.py                 # get_current_user dependency
│   │   └── utils.py                # Shared utilities
│   ├── functions/
│   │   └── verification.py         # OTP / email link dispatch logic
│   ├── utils/
│   │   ├── email_service.py        # Resend email adapter
│   │   └── sms_service.py          # OTS SMS adapter
│   └── routes/
│       ├── auth.py                 # Register, login, verify, password reset
│       ├── user.py                 # Profile CRUD, password change, account deletion
│       ├── dashboard.py            # Dashboard stats
│       ├── notes.py                # Notes list, view, download, upload, review
│       ├── past_papers.py          # Past papers list, view, download, upload, review
│       ├── blogs.py                # Blog CRUD and reviews
│       ├── groups.py               # Public groups listing
│       └── admin/
│           ├── users.py            # Admin — user management
│           ├── notes.py            # Admin — notes moderation
│           ├── past_papers.py      # Admin — past papers moderation
│           ├── blogs.py            # Admin — blog management
│           └── groups.py           # Admin — groups & specializations
│
└── frontend/                       # React + Vite frontend
    ├── index.html
    ├── vite.config.ts
    ├── tailwind.config.ts
    ├── package.json
    ├── components.json             # shadcn/ui component config
    ├── public/                     # Static assets (icons, images)
    └── src/
        ├── main.tsx
        ├── App.tsx                 # Router setup
        ├── index.css               # Global styles + Tailwind directives
        ├── contexts/
        │   └── AuthContext.tsx     # Auth state, login/logout/register
        ├── lib/
        │   ├── api.ts              # Axios instance + all API calls
        │   ├── utils.ts            # cn() helper
        │   ├── toast.ts            # Toast wrapper
        │   ├── secureDownload.ts   # Authenticated file download
        │   ├── cropImage.ts        # Canvas image cropping
        │   ├── imageCompression.ts
        │   └── githubCdn.ts        # File upload to GitHub CDN
        ├── components/             # Reusable UI components
        │   ├── ui/                 # shadcn/ui primitives
        │   ├── Layout.tsx
        │   ├── Navbar.tsx
        │   ├── Footer.tsx
        │   ├── PageSkeletons.tsx
        │   ├── SpecializationFilter.tsx
        │   └── ...
        ├── pages/
        │   ├── Home.tsx
        │   ├── Dashboard.tsx
        │   ├── Notes.tsx
        │   ├── PastPapers.tsx
        │   ├── Blog.tsx
        │   ├── Profile.tsx
        │   ├── auth/
        │   │   ├── Login.tsx
        │   │   ├── Register.tsx
        │   │   ├── VerifyEmail.tsx
        │   │   ├── ForgotPassword.tsx
        │   │   └── ResetPassword.tsx
        │   └── admin/
        │       └── Admin.tsx       # Full admin dashboard (users, notes, papers, blogs, groups)
        ├── hooks/
        └── utils/
```

---

## Features

- **Authentication** — Register with email or SMS verification, login, forgot/reset password
- **Role system** — `user` (student) → `admin` → `super_admin`
  - The very first registered user automatically becomes Super Admin
- **Notes** — Upload PDF notes; admins approve/reject with feedback; all students can browse by year, semester, specialization
- **Past Papers** — Same flow as notes, with exam year field
- **My Uploads** — Students see all their uploads including pending and rejected ones (with admin feedback)
- **Blogs** — Rich-text announcements; admins publish, students comment
- **Groups & Specializations** — Admins manage study groups; Year 3+ students must pick a group
- **Profile** — Edit name, year, semester, group, specialization; upload profile picture (stored as base64)
- **Admin Panel** — Full CRUD for users, notes, papers, blogs, groups; filter and search

---

## Prerequisites

| Tool | Version |
|---|---|
| Python | 3.11+ |
| Node.js | 18+ |
| npm / bun | latest |
| MongoDB | 6.0+ (local) or Atlas account |

---

## Database Setup

### Option A — MongoDB Atlas (Cloud, Free)

Best for Vercel/Railway/Render/Heroku deployments. MongoDB Atlas M0 (free tier) gives 512 MB — plenty for this platform.

1. Go to [https://cloud.mongodb.com](https://cloud.mongodb.com) and create a free account.
2. Click **Build a Database** → choose **M0 Free** → pick a region close to your backend host.
3. Create a database user (username + password). Save these.
4. Under **Network Access**, click **Add IP Address** → **Allow Access from Anywhere** (`0.0.0.0/0`) for hosted backends, or add only your VPS IP for security.
5. Click **Connect** → **Drivers** → copy the connection string. It looks like:
   ```
   mongodb+srv://myuser:mypassword@cluster0.abcde.mongodb.net/?retryWrites=true&w=majority
   ```
6. Add `sbe_annex` as the database name (the backend creates collections automatically):
   ```
   mongodb+srv://myuser:mypassword@cluster0.abcde.mongodb.net/sbe_annex?retryWrites=true&w=majority
   ```
7. Set `MONGO_URL` to this connection string and `DB_NAME=sbe_annex` in your backend `.env`.

---

### Option B — Local MongoDB (VPS / Self-Hosted)

#### Install MongoDB on Ubuntu 22.04

```bash
# Import GPG key
curl -fsSL https://www.mongodb.org/static/pgp/server-7.0.asc | \
  sudo gpg -o /usr/share/keyrings/mongodb-server-7.0.gpg --dearmor

# Add repository
echo "deb [ arch=amd64,arm64 signed-by=/usr/share/keyrings/mongodb-server-7.0.gpg ] \
  https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/7.0 multiverse" | \
  sudo tee /etc/apt/sources.list.d/mongodb-org-7.0.list

# Install
sudo apt update
sudo apt install -y mongodb-org

# Start and enable
sudo systemctl start mongod
sudo systemctl enable mongod

# Verify
mongosh --eval 'db.runCommand({ connectionStatus: 1 })'
```

Use `MONGO_URL=mongodb://localhost:27017` in your `.env`.

#### Install MongoDB on CentOS/RHEL

```bash
cat <<'EOF' | sudo tee /etc/yum.repos.d/mongodb-org-7.0.repo
[mongodb-org-7.0]
name=MongoDB Repository
baseurl=https://repo.mongodb.org/yum/redhat/9/mongodb-org/7.0/x86_64/
gpgcheck=1
enabled=1
gpgkey=https://www.mongodb.org/static/pgp/server-7.0.asc
EOF

sudo yum install -y mongodb-org
sudo systemctl start mongod
sudo systemctl enable mongod
```

---

## Local Development

### Backend Local Setup

```bash
# 1 — Clone and enter backend folder
git clone https://github.com/mauricegift/sbe-annex.git
cd sbe-annex/backend

# 2 — Create a Python virtual environment
python3 -m venv venv
source venv/bin/activate       # Windows: venv\Scripts\activate

# 3 — Install dependencies
pip install -r requirements.txt

# 4 — Configure environment
cp .env.example .env
# Edit .env and fill in at minimum:
#   MONGO_URL, SECRET_KEY, RESEND_API_KEY, SMS_API_KEY

# 5 — Run the development server
python app.py
# or with uvicorn directly:
uvicorn app:app --reload --port 3192
```

The API will be available at `http://localhost:3192`.  
Interactive docs: `http://localhost:3192/docs`

---

### Frontend Local Setup

```bash
# From the repo root
cd sbe-annex/frontend

# Install dependencies (using npm or bun)
npm install
# or: bun install

# Configure environment
cp .env.example .env
# Set VITE_API_URL=http://localhost:3192

# Start development server
npm run dev
# or: bun dev
```

The frontend will be at `http://localhost:5173`.

> **CORS note:** Make sure `http://localhost:5173` is listed in `CORS_ORIGINS` in the backend `.env`.

---

## Environment Variables Reference

### Backend `.env`

Create `backend/.env` from `backend/.env.example`:

```env
# ── MongoDB ──────────────────────────────────────────────────────────────────
# Local MongoDB (recommended for VPS):
MONGO_URL=mongodb://localhost:27017
# OR Atlas (recommended for cloud hosting):
# MONGO_URL=mongodb+srv://user:pass@cluster.mongodb.net/sbe_annex?retryWrites=true&w=majority

DB_NAME=sbe_annex

# ── JWT / Security ────────────────────────────────────────────────────────────
# Generate a strong secret: python -c "import secrets; print(secrets.token_hex(48))"
SECRET_KEY=your-very-long-random-secret-key
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=7200    # 5 days

# ── Server ────────────────────────────────────────────────────────────────────
PORT=3192
BASE_URL=https://your-backend-domain.com

# ── Frontend URL (used in email links) ───────────────────────────────────────
FRONTEND_URL=https://your-frontend-domain.com

# ── CORS (comma-separated list of allowed frontend origins) ──────────────────
# Include localhost for local dev, your production domain(s) for production
CORS_ORIGINS=https://your-frontend-domain.com,http://localhost:5173

# ── Email — Resend (https://resend.com — free 3,000 emails/month) ─────────────
RESEND_API_KEY=re_your_api_key
RESEND_FROM=SBE Annex <noreply@yourdomain.com>
RESEND_REPLY_TO=support@yourdomain.com

# ── SMS — CONFIGURATION ────────────────────────────────
SMS_API_KEY=your_ots_api_key
SMS_API_URL=
SMS_SENDER_ID=YOURID

# ── Branding ──────────────────────────────────────────────────────────────────
BRAND_COLOR=#16a34a
APP_NAME=SBE Annex

# ── Verification cooldown (seconds between resend requests) ───────────────────
RESEND_COOLDOWN_SECONDS=60
```

### Frontend `.env`

Create `frontend/.env` from `frontend/.env.example` or just add your backend url to vercel.json in production:

```env
# Backend API base URL (no trailing slash)
# Local dev:
VITE_API_URL=http://localhost:3192
# Production:
# VITE_API_URL=https://your-backend-domain.com
```

---

## Deployment

### Frontend — Vercel

The simplest way to deploy the React frontend.

1. Push the repo to GitHub (the `sbe-annex` monorepo).
2. Go to [https://vercel.com](https://vercel.com) → **New Project** → import your repository.
3. Set **Root Directory** to `frontend`.
4. Set **Framework Preset** to `Vite`.
5. Under **Environment Variables**, add:
   ```
   VITE_API_URL = https://your-backend-domain.com
   ```
6. Click **Deploy**.

The `frontend/vercel.json` handles client-side routing (SPA rewrites):
```json
{
  "rewrites": [{ "source": "/(.*)", "destination": "/" }]
}
```

> After deploying, add the Vercel domain to `CORS_ORIGINS` in your backend `.env`.

---

### Backend — Railway

Railway offers a free starter plan with 500 hours/month.

1. Go to [https://railway.app](https://railway.app) → **New Project** → **Deploy from GitHub repo**.
2. Select your `sbe-annex` repo, set **Root Directory** to `backend`.
3. Railway auto-detects Python. Add a `Procfile` in `backend/` if not present:
   ```
   web: gunicorn app:app -c gunicorn_conf.py
   ```
4. Under **Variables**, add all your `.env` values (except `.env` itself — Railway has a secrets UI).
5. Under **Settings → Networking**, expose the service and note the public domain.
6. Set `BASE_URL` to that Railway domain and add it to frontend's `VITE_API_URL`.

---

### Backend — Render

Render's free tier spins down after 15 min of inactivity (paid plans stay always-on).

1. Go to [https://render.com](https://render.com) → **New Web Service** → connect GitHub.
2. Select your repo, set **Root Directory** to `backend`.
3. Set **Build Command**: `pip install -r requirements.txt`
4. Set **Start Command**: `gunicorn app:app -c gunicorn_conf.py`
5. Set **Environment** to Python 3.
6. Add all your environment variables under **Environment**.
7. Deploy. Note your `.onrender.com` domain for `BASE_URL` and `CORS_ORIGINS`.

---

### Backend — Heroku

Heroku requires a `Procfile` (already included):

```bash
# Install Heroku CLI, then:
heroku create your-app-name
heroku config:set MONGO_URL="mongodb+srv://..." SECRET_KEY="..." RESEND_API_KEY="..."
# ... set all other env vars

git subtree push --prefix backend heroku main
# or use heroku-buildpack-monorepo if deploying from root
```

Use MongoDB Atlas for the database (Heroku doesn't host MongoDB natively anymore).

---

### Backend — VPS (Ubuntu)

Complete guide for a self-managed Ubuntu 20.04/22.04 VPS.

#### 1. Connect and update

```bash
ssh root@your.vps.ip
apt update && apt upgrade -y
```

#### 2. Install Python 3.11+

```bash
apt install -y python3.11 python3.11-venv python3-pip
```

#### 3. Install MongoDB (see [Database Setup — Option B](#option-b--local-mongodb-vps--self-hosted))

#### 4. Clone the repo

```bash
git clone https://github.com/mauricegift/sbe-annex.git /srv/sbe-annex
cd /srv/sbe-annex/backend
```

#### 5. Create virtual environment and install dependencies

```bash
python3.11 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

#### 6. Create `.env`

```bash
cp .env.example .env
nano .env   # Fill in all values
```

#### 7. Run with Gunicorn (production)

```bash
gunicorn app:app -c gunicorn_conf.py
```

Or use the included `start.sh`:

```bash
chmod +x start.sh
./start.sh
```

#### 8. Set up as a systemd service (auto-restart)

```bash
cat > /etc/systemd/system/sbe-annex.service << 'EOF'
[Unit]
Description=SBE Annex Backend
After=network.target mongod.service

[Service]
User=root
WorkingDirectory=/srv/sbe-annex/backend
Environment="PATH=/srv/sbe-annex/backend/venv/bin"
ExecStart=/srv/sbe-annex/backend/venv/bin/gunicorn app:app -c gunicorn_conf.py
Restart=on-failure
RestartSec=5

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload
systemctl enable sbe-annex
systemctl start sbe-annex
systemctl status sbe-annex
```

#### 9. Set up Nginx as reverse proxy

```bash
apt install -y nginx

cat > /etc/nginx/sites-available/sbe-annex << 'EOF'
server {
    listen 80;
    server_name api.yourdomain.com;

    location / {
        proxy_pass http://127.0.0.1:3192;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        client_max_body_size 50M;
    }
}
EOF

ln -s /etc/nginx/sites-available/sbe-annex /etc/nginx/sites-enabled/
nginx -t && systemctl reload nginx
```

#### 10. Enable HTTPS with Let's Encrypt

```bash
apt install -y certbot python3-certbot-nginx
certbot --nginx -d api.yourdomain.com
```

---

## API Overview

All endpoints are prefixed with `/api`. Full interactive docs at `GET /docs`.

| Group | Prefix | Description |
|---|---|---|
| Auth | `/api/auth` | Register, login, verify, password reset, account deletion |
| User | `/api/user` | Profile view/edit, password change, profile picture |
| Dashboard | `/api/dashboard` | Stats overview |
| Notes | `/api/notes` | Browse, view, download, upload, my uploads |
| Past Papers | `/api/past-papers` | Browse, view, download, upload, my uploads |
| Blogs | `/api/blogs` | List, view, reviews |
| Groups | `/api/groups` | Public groups and specializations list |
| Admin — Users | `/api/admin/users` | List, view, edit, disable, delete users |
| Admin — Notes | `/api/admin/notes` | Approve/reject notes with feedback |
| Admin — Papers | `/api/admin/past-papers` | Approve/reject papers with feedback |
| Admin — Blogs | `/api/admin/blogs` | Create, edit, publish, delete blogs |
| Admin — Groups | `/api/admin/groups` | Manage groups and specializations |

---

## First-Time Setup (Super Admin)

The platform uses a self-service super admin bootstrap:

1. Deploy the backend and frontend.
2. Open the frontend registration page.
3. Register the **first account** — it will automatically receive the `super_admin` role.
4. Log in and go to the **Admin** panel to:
   - Add study groups and specializations
   - Approve user uploads
   - Manage users

> No manual database editing or secret bootstrapping required.

---

## Contributing

1. Fork this repository.
2. Create a feature branch: `git checkout -b feat/your-feature`
3. Commit your changes: `git commit -m 'feat: add your feature'`
4. Push to your branch: `git push origin feat/your-feature`
5. Open a Pull Request.

---

- **[CONTACT SUPPORT](https://api.giftedtech.co.ke/contact) For More Info**
- **Join [WHATSAPP CHANNEL](https://whatsapp.com/channel/0029VbCpYtZLtOj5LDuj7Q1p) for Daily Updates.**
- **Check out my [Website Profile](https://me.giftedtech.co.ke) for More Projects.**

**Built with ❤️ for SBE students**
