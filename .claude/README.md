# Claude Code Setup für ReviewResponder

Komplette Claude Code Integration basierend auf Best Practices 2026.

## 📁 Verzeichnis-Struktur

```
.claude/
├── README.md              # Diese Datei - Übersicht
├── settings.json          # Hooks & Permissions Config
├── hooks/                 # Automation Scripts
│   ├── README.md         # Hook Dokumentation
│   ├── check-branch.sh   # Branch Protection
│   ├── log-commands.sh   # Command Logging
│   └── remind-test.sh    # Test Reminders
├── github-workflow.md     # Git & GitHub Best Practices
├── mcp-servers.md         # MCP Server Guide (optional)
└── command-history.log    # Auto-generiert von log-commands.sh
```

---

## 🚀 Was ist neu?

### 1. CLAUDE.md erweitert
**Hinzugefügt:**
- **Development Guidelines** - Code Style, Testing, Git Conventions
- **Development Commands** - Häufig genutzte Commands dokumentiert
- **Preferred Patterns** - Best Practices aus dem Kurs

**Warum wichtig:**
Claude startet jetzt JEDE Session mit diesem Context vorgeladen!

### 2. Automatische Hooks
**Aktive Hooks:**
- `check-branch.sh` - Verhindert Pushes auf main/master
- `log-commands.sh` - Loggt alle wichtigen Commands
- `remind-test.sh` - Erinnert an Tests nach Code-Änderungen

**Benefit:**
Keine versehentlichen Fehler mehr, automatische Dokumentation!

### 3. MCP Server Ready
**Vorbereitet für:**
- PostgreSQL Direktzugriff
- GitHub Integration
- Web Scraping Tools
- Stripe Automation

**Status:** Noch nicht installiert (nicht benötigt aktuell)

### 4. GitHub Workflow Optimierung
**Dokumentiert:**
- Branch Strategy
- PR Workflow
- Issue Management
- Automation Potential

---

## 📚 Dokumentation

| Datei | Zweck | Wann lesen? |
|-------|-------|-------------|
| **CLAUDE.md** | Projekt-Gedächtnis (Root) | Immer zuerst! |
| **hooks/README.md** | Hook System erklärt | Bei Hook-Problemen |
| **github-workflow.md** | Git Best Practices | Vor PR/Commit |
| **mcp-servers.md** | MCP Setup Guide | Wenn externe Tools nötig |

---

## ⚡ Quick Start für neue Claude Sessions

### Session Start Checklist
1. ✅ CLAUDE.md wird automatisch geladen
2. ✅ Hooks sind aktiv (settings.json)
3. ✅ Branch Check läuft automatisch
4. ✅ Commands werden geloggt

**Du musst nichts machen** - Claude kennt jetzt das Projekt!

### Häufige Commands (aus CLAUDE.md)
```bash
# Backend testen
cd backend && node server.js

# Frontend testen
cd frontend && npm start

# Git Status
git status

# Schnelles Commit & Push
git add -A && git commit -m "Beschreibung" && git push -u origin claude/learn-claude-code-eKiGe
```

---

## 🎯 Features aus dem Kurs implementiert

### ✅ Context Management
- [x] CLAUDE.md als zentrale Wissensbasis
- [x] Strukturiert nach WHAT, WHY, HOW
- [x] Konkrete Commands dokumentiert
- [x] Code Style & Best Practices

### ✅ Custom Automation (Hooks)
- [x] PreToolUse Hooks (Branch Protection)
- [x] PostToolUse Hooks (Logging, Reminders)
- [x] Executable Scripts in .claude/hooks/
- [x] Dokumentiert in hooks/README.md

### ✅ GitHub Integration
- [x] Branch Strategy dokumentiert
- [x] PR Workflow mit gh CLI
- [x] Issue Management Guide
- [x] Commit Message Best Practices

### ⏳ MCP Servers (optional)
- [ ] PostgreSQL MCP (vorbereitet, nicht installiert)
- [ ] GitHub MCP (vorbereitet, nicht installiert)
- [ ] Custom Stripe MCP (Future)

### ✅ Visual Workflows
- [x] Screenshot Tool in CLAUDE.md dokumentiert
- [x] PowerShell Script für Clipboard

---

## 🔧 Konfiguration Details

### settings.json Breakdown
```json
{
  "permissions": {
    "allow": ["Bash", "Read", "Write", "Edit", "Glob", "Grep"]
  },
  "hooks": {
    "PreToolUse": [
      // check-branch.sh - Verhindert main/master Pushes
    ],
    "PostToolUse": [
      // log-commands.sh - Command Logging
      // remind-test.sh - Test Reminders
    ]
  }
}
```

### Hook Execution Flow
```
Claude will Bash Command ausführen
    ↓
PreToolUse Hook: check-branch.sh
    ↓ (wenn pass)
Bash Command wird ausgeführt
    ↓
PostToolUse Hook: log-commands.sh
    ↓
Fertig (Output an Claude)
```

---

## 📊 Command History Tracking

Alle wichtigen Commands werden geloggt in `.claude/command-history.log`:

**Format:**
```
[2026-01-10 14:23:45] git push -u origin claude/learn-claude-code-eKiGe
[2026-01-10 14:25:12] cd backend && node server.js
[2026-01-10 14:30:01] npm install express
```

**Nutzen:**
- Debugging: Was wurde wann ausgeführt?
- Dokumentation: Welche Commands sind wichtig?
- Audit Trail: Nachvollziehbarkeit

---

## 🎓 Weitere Ressourcen

### Anthropic Claude Code Kurs
**"Claude Code in Action"** - 2 Stunden kostenlos
- URL: https://anthropic.skilljar.com/claude-code-in-action
- Oder auf Coursera

**Inhalte:**
- Context Management (✅ implementiert)
- Custom Hooks (✅ implementiert)
- MCP Servers (⏳ vorbereitet)
- GitHub Workflows (✅ dokumentiert)

### Offizielle Docs
- Claude Code Docs: https://code.claude.com/docs
- Hooks Guide: https://code.claude.com/docs/en/hooks-guide
- MCP Protocol: https://modelcontextprotocol.io/

### Community Resources
- GitHub: https://github.com/anthropics/courses
- Best Practices: https://www.anthropic.com/engineering/claude-code-best-practices
- CLAUDE.md Guide: https://claude.com/blog/using-claude-md-files

---

## 🐛 Troubleshooting

### Hooks funktionieren nicht
```bash
# Check ob Scripts executable sind
ls -la .claude/hooks/

# Executable machen falls nötig
chmod +x .claude/hooks/*.sh
```

### Settings.json Syntax Error
```bash
# Validiere JSON
cat .claude/settings.json | jq .

# Falls Fehler: Fix Syntax in Editor
```

### Command History Log wird zu groß
```bash
# Log bereinigen (älter als 7 Tage)
find .claude/command-history.log -mtime +7 -delete

# Oder: Archivieren
mv .claude/command-history.log .claude/command-history-$(date +%Y%m%d).log
```

---

## 🔮 Nächste Schritte

### Phase 1: Jetzt Live ✅
- CLAUDE.md erweitert
- Hooks aktiviert
- GitHub Workflow dokumentiert

### Phase 2: Optional Later
- [ ] MCP Server für PostgreSQL installieren (bei Bedarf)
- [ ] GitHub Actions für Auto-Labeling (bei mehr PRs)
- [ ] Custom Skills für häufige Tasks

### Phase 3: Advanced
- [ ] Claude-basierte PR Reviews automatisieren
- [ ] Issue Triage mit Claude
- [ ] Automated Release Notes

---

## 💡 Tips für optimale Nutzung

1. **Immer CLAUDE.md checken:** Ist die zentrale Wahrheit
2. **Hooks vertrauen:** Sie verhindern Fehler automatisch
3. **Command History nutzen:** Bei Debugging
4. **Docs erweitern:** Wenn neue Patterns/Commands häufig genutzt werden
5. **MCP erst wenn nötig:** Nicht zu früh optimieren

---

**Setup abgeschlossen!** 🎉

Claude Code ist jetzt optimal für ReviewResponder konfiguriert.
Alle Best Practices aus dem 2-Stunden Kurs sind implementiert.

---

**Letzte Aktualisierung:** 10.01.2026
**Version:** 1.0
**Erstellt von:** Claude (basierend auf Anthropic Kurs 2026)
