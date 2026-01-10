# ReviewResponder - Developer Guide

> **Anti-Vibe-Coder Handbuch** - Die Basics die jeder Developer verstehen muss.

---

## 🚨 VIBE CODER PREVENTION

**Was ist ein "Vibe Coder"?** Jemand der mit AI-Tools arbeitet ohne die Fundamentals zu verstehen.

Diese 7 Dinge MUSST du verstehen:

### 1. `.env` Files - NEVER COMMIT SECRETS!

**Was ist das?**
Environment Variables - enthält ALLE Secrets (API Keys, Credentials, Tokens).

**Warum kritisch?**
- Eine `.env` in Git = Alle Secrets öffentlich
- GitHub scannt automatisch und disabled compromised keys
- Hacker scrapen GitHub nach exposed secrets

**ReviewResponder .env Struktur:**
```bash
# Database
DATABASE_URL=postgresql://user:password@host:5432/dbname

# AI APIs
OPENAI_API_KEY=sk-proj-xxx
ANTHROPIC_API_KEY=sk-ant-xxx

# Auth
JWT_SECRET=random-secret-string-min-32-chars

# Payments
STRIPE_SECRET_KEY=sk_live_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx

# Email
RESEND_API_KEY=re_xxx
GOOGLE_CLIENT_ID=xxx.apps.googleusercontent.com

# App Config
FRONTEND_URL=https://tryreviewresponder.com
NODE_ENV=production
```

**Sicherheit:**
```bash
# ✅ RICHTIG - .gitignore enthält:
.env
.env.local
.env.production

# ❌ FALSCH - NIEMALS:
git add .env
git add -A  # (wenn .env nicht in .gitignore!)
```

**Lokales Setup:**
1. Kopiere `.env.example` zu `.env`
2. Fülle Secrets aus (frag Berend für Prod-Keys)
3. Teste mit `node -e "console.log(process.env.DATABASE_URL)"`

---

### 2. `npm run dev` - Local Development

**Was macht das?**
Startet Development Server mit Hot-Reload.

**ReviewResponder Setup:**

```bash
# Backend starten (Port 3001)
cd backend
npm install          # Dependencies installieren
npm run dev          # Server starten
# → läuft auf http://localhost:3001

# Frontend starten (Port 3000)
cd frontend
npm install
npm start            # React Dev Server
# → läuft auf http://localhost:3000
```

**Development Flow:**
1. Backend starten (`npm run dev` in backend/)
2. Frontend starten (`npm start` in frontend/)
3. Code ändern → Auto-Reload
4. Testen auf localhost:3000

**Häufige Probleme:**

```bash
# Problem: "Port already in use"
# Fix: Kill den Prozess
lsof -ti:3001 | xargs kill -9  # Backend
lsof -ti:3000 | xargs kill -9  # Frontend

# Problem: "Module not found"
# Fix: Dependencies neu installieren
rm -rf node_modules package-lock.json
npm install

# Problem: ".env not loaded"
# Fix: .env muss im Root des Projekts sein
ls -la .env  # Check ob file existiert
```

---

### 3. `package.json` - Project Manifest

**Was ist das?**
Die "Bauanleitung" für dein Node.js Projekt.

**ReviewResponder Backend package.json:**
```json
{
  "name": "reviewresponder-backend",
  "version": "1.0.0",
  "scripts": {
    "start": "node server.js",      // Production
    "dev": "nodemon server.js"       // Development (Auto-Reload)
  },
  "dependencies": {
    "express": "^4.18.0",           // Web Framework
    "pg": "^8.11.0",                // PostgreSQL Client
    "stripe": "^14.0.0",            // Payments
    "openai": "^4.20.0",            // GPT-4o
    "@anthropic-ai/sdk": "^0.9.0",  // Claude API
    "jsonwebtoken": "^9.0.0",       // JWT Auth
    "bcryptjs": "^2.4.3",           // Password Hashing
    "resend": "^2.0.0",             // Email
    "cors": "^2.8.5",               // CORS Headers
    "dotenv": "^16.0.0"             // .env Loading
  },
  "devDependencies": {
    "nodemon": "^3.0.0"             // Auto-Restart Dev Server
  }
}
```

**Wichtige Befehle:**
```bash
npm install                    # Alle Dependencies installieren
npm install <package>          # Neue Dependency hinzufügen
npm uninstall <package>        # Dependency entfernen
npm update                     # Dependencies updaten
npm audit fix                  # Security Vulnerabilities fixen
```

**Dependencies verstehen:**
```json
"express": "^4.18.0"
//         ^ = Compatible version (4.x.x)
//         ~ = Patch version only (4.18.x)
//         Keine Symbol = Exact version
```

---

### 4. `npm run build` - Production Build

**Was macht das?**
Erstellt optimierten Production-Build (minified, compressed, tree-shaken).

**ReviewResponder Build Process:**

```bash
# Frontend Build (React)
cd frontend
npm run build
# → Erstellt /build Ordner
# → Statische HTML/CSS/JS Files
# → Optimiert & Minified
# → Ready für Render Static Site

# Backend Build
# → Node.js braucht keinen Build
# → Läuft direkt mit "node server.js"
```

**Development vs Production:**

| Aspekt | Development | Production |
|--------|-------------|------------|
| **Befehl** | `npm start` | `npm run build` |
| **Port** | 3000 (local) | 443/80 (HTTPS) |
| **Optimierung** | Nein (schnelle Reloads) | Ja (minified, compressed) |
| **Source Maps** | Ja (debugging) | Nein (security) |
| **Error Messages** | Detailliert | Generic |
| **Hot Reload** | Ja | Nein |

**Render Deployment:**
```bash
# Render macht automatisch:
1. git pull origin main
2. npm install
3. npm run build  (Frontend)
4. npm start      (Backend)
```

---

### 5. npm Packages - Dependency Management

**Was sind npm packages?**
Externe Libraries die du in dein Projekt importierst.

**ReviewResponder Dependencies (Backend):**

```javascript
// Express - Web Framework
const express = require('express');
const app = express();

// PostgreSQL - Database
const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// Stripe - Payments
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

// OpenAI - GPT-4o
const OpenAI = require('openai');
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Claude - Smart AI
const Anthropic = require('@anthropic-ai/sdk');
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// JWT - Authentication
const jwt = require('jsonwebtoken');

// bcrypt - Password Hashing
const bcrypt = require('bcryptjs');

// Resend - Email
const { Resend } = require('resend');
const resend = new Resend(process.env.RESEND_API_KEY);
```

**Security Best Practices:**

```bash
# Regelmäßig auf Vulnerabilities checken
npm audit

# Auto-Fix (vorsichtig - kann Breaking Changes haben)
npm audit fix

# Kritische Updates
npm audit fix --force

# Dependencies updaten
npm update

# Veraltete Packages anzeigen
npm outdated
```

**Häufige Probleme:**

```bash
# Problem: "Cannot find module 'xyz'"
# Fix: Package installieren
npm install xyz

# Problem: "Peer dependency warnings"
# Fix: Meist egal, nur Warning (nicht Error)

# Problem: "Package deprecated"
# Fix: Alternative suchen oder ignorieren (wenn nicht kritisch)
```

---

### 6. `git add .env` - THE FORBIDDEN COMMAND

**NIEMALS AUSFÜHREN:**
```bash
git add .env           # ❌ VERBOTEN
git add -A             # ⚠️ Gefährlich (fügt ALLES hinzu)
git commit -a          # ⚠️ Gefährlich (committed ALLES)
```

**IMMER CHECKEN vor Commit:**
```bash
# 1. Status checken
git status
# → Schau ob .env dabei ist!

# 2. Diff anschauen
git diff
# → Überprüf was du committen willst

# 3. Staged Files checken
git diff --staged
# → Was wird committed?

# 4. Erst dann committen
git commit -m "Message"
```

**Falls .env versehentlich committed:**

```bash
# SOFORT HANDELN!
# 1. Aus Git History entfernen
git filter-branch --force --index-filter \
  "git rm --cached --ignore-unmatch .env" \
  --prune-empty --tag-name-filter cat -- --all

# 2. Force Push (VORSICHT!)
git push origin main --force

# 3. ALLE SECRETS ROTIEREN!
# → Neue Stripe Keys generieren
# → Neue DB Credentials
# → Neue JWT Secret
# → Neue API Keys
```

**Prevention:**

```bash
# .gitignore MUSS enthalten:
.env
.env.local
.env.production
.env.development
*.env

# Testen ob .gitignore funktioniert:
git add .env
# → Sollte Fehler geben: "The following paths are ignored by one of your .gitignore files"
```

---

### 7. `http://localhost:3000/` - Local vs Production

**Kritisch verstehen:**

```
LOCAL (Development):
  http://localhost:3000          # Frontend
  http://localhost:3001          # Backend
  → NUR auf deinem PC erreichbar!
  → User im Internet sehen das NICHT!

PRODUCTION (Live):
  https://tryreviewresponder.com       # Frontend
  https://review-responder.onrender.com  # Backend
  → Öffentlich für alle User
  → Echte Payments, echte Daten
```

**Environment-Handling:**

```javascript
// Frontend (React)
const API_URL = process.env.NODE_ENV === 'production'
  ? 'https://review-responder.onrender.com'
  : 'http://localhost:3001';

// Backend
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';
```

**Häufiger Fehler:**

```javascript
// ❌ FALSCH - Hardcoded localhost
fetch('http://localhost:3001/api/generate', {...})
// → Funktioniert nur lokal!

// ✅ RICHTIG - Environment-basiert
fetch(`${API_URL}/api/generate`, {...})
```

**CORS Setup (Backend):**

```javascript
const cors = require('cors');
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));
```

---

## 🏗️ PROJECT STRUCTURE

```
ReviewResponder/
├── backend/
│   ├── server.js              # Main Backend (Express API)
│   ├── package.json           # Backend Dependencies
│   ├── .env                   # Secrets (NEVER commit!)
│   └── node_modules/          # Installed Packages
│
├── frontend/
│   ├── src/
│   │   ├── App.js            # Main React Component
│   │   ├── App.css           # Styles
│   │   └── index.js          # React Entry Point
│   ├── public/
│   │   └── index.html        # HTML Template
│   ├── package.json          # Frontend Dependencies
│   └── build/                # Production Build (generated)
│
├── chrome-extension/
│   ├── manifest.json         # Extension Config
│   ├── content.js            # Injected Script
│   └── background.js         # Service Worker
│
├── content/
│   ├── outreach/             # Cold Email Templates
│   ├── product-hunt/         # Launch Materials
│   └── social/               # Social Media Content
│
├── scripts/
│   └── outreach-automation.js  # Marketing Automation
│
├── .gitignore                # Git Ignore Rules
├── CLAUDE.md                 # AI Assistant Memory
├── DEVELOPER_GUIDE.md        # This File
└── README.md                 # Public Documentation
```

---

## 🚀 COMMON WORKFLOWS

### First Time Setup

```bash
# 1. Clone Repo
git clone https://github.com/berschlend/review-responder.git
cd review-responder

# 2. Backend Setup
cd backend
npm install
cp .env.example .env  # Dann Secrets ausfüllen
npm run dev

# 3. Frontend Setup (neues Terminal)
cd ../frontend
npm install
npm start

# 4. Chrome Extension
cd ../chrome-extension
# → Load unpacked in chrome://extensions
```

### Development Workflow

```bash
# 1. Branch erstellen
git checkout -b feature/neue-funktion

# 2. Code ändern
# ... entwickle dein Feature ...

# 3. Testen
npm run dev     # Backend
npm start       # Frontend

# 4. Committen
git status      # Checken was geändert wurde
git add .       # (nachdem du .gitignore geprüft hast!)
git commit -m "Add: Neue Funktion XYZ"

# 5. Pushen
git push -u origin feature/neue-funktion

# 6. Merge zu Main
git checkout main
git merge feature/neue-funktion
git push

# → Render deployed automatisch!
```

### Debugging Workflow

```bash
# Backend Logs (Render)
# → Render Dashboard → Logs Tab

# Local Backend Debug
DEBUG=* npm run dev  # Verbose Logging

# Database Query
psql $DATABASE_URL
SELECT * FROM users LIMIT 5;

# API Testing
curl -X POST http://localhost:3001/api/generate \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{"review": "Great service!", "tone": "professional"}'
```

---

## 🔒 SECURITY CHECKLIST

Vor jedem Production Push:

- [ ] `.env` ist in `.gitignore`
- [ ] Keine Secrets in Code hardcoded
- [ ] `npm audit` zeigt keine critical vulnerabilities
- [ ] CORS ist korrekt konfiguriert
- [ ] JWT Tokens expiren (nicht ewig gültig)
- [ ] Passwords werden gehashed (bcrypt)
- [ ] SQL Queries nutzen Prepared Statements
- [ ] Input Validation auf allen Endpoints
- [ ] Error Messages leaken keine sensiblen Infos
- [ ] Rate Limiting ist aktiv
- [ ] HTTPS ist enforced (Production)

---

## 📚 LEARNING RESOURCES

### Node.js Basics
- [Node.js Docs](https://nodejs.org/docs)
- [Express Guide](https://expressjs.com/en/guide/routing.html)
- [npm CLI Docs](https://docs.npmjs.com/cli)

### Database
- [PostgreSQL Tutorial](https://www.postgresql.org/docs/current/tutorial.html)
- [SQL Basics](https://www.w3schools.com/sql/)

### Security
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [JWT Best Practices](https://tools.ietf.org/html/rfc8725)

### Git
- [Git Basics](https://git-scm.com/book/en/v2/Getting-Started-Git-Basics)
- [GitHub Flow](https://guides.github.com/introduction/flow/)

---

## 🆘 TROUBLESHOOTING

### "Module not found"
```bash
rm -rf node_modules package-lock.json
npm install
```

### "Port already in use"
```bash
lsof -ti:3001 | xargs kill -9
```

### "Cannot connect to database"
```bash
# Check .env
echo $DATABASE_URL

# Test connection
psql $DATABASE_URL -c "SELECT 1;"
```

### "CORS error"
```javascript
// Backend: Check CORS config
app.use(cors({
  origin: process.env.FRONTEND_URL,
  credentials: true
}));
```

### "Stripe webhook failing"
```bash
# Check webhook secret
echo $STRIPE_WEBHOOK_SECRET

# Test webhook locally
stripe listen --forward-to localhost:3001/api/webhooks/stripe
```

---

## 👤 CONTACT

**Questions?** Ask Berend Mainz (berend.mainz@web.de)

**Found a bug?** Create GitHub Issue

**Need help?** Check CLAUDE.md first, dann fragen

---

> **Remember:** You're not a Vibe Coder anymore. You understand the fundamentals! 🚀
