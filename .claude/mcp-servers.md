# MCP Server Configuration für ReviewResponder

MCP (Model Context Protocol) Servers erweitern Claude Code mit externen Tools.

## Aktuell installiert

**Keine MCP Servers aktiv** - Das Projekt nutzt Standard-Stack und benötigt aktuell keine externen Integrationen.

---

## Empfohlene MCP Servers für ReviewResponder

### 1. PostgreSQL MCP Server
**Nutzen:** Direkter DB-Zugriff für Queries, Schema-Checks, Debugging
**Installation:**
```bash
npm install -g @modelcontextprotocol/server-postgres
```

**Config in `~/.claude.json`:**
```json
{
  "mcpServers": {
    "postgres": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-postgres", "postgresql://user:pass@host/db"]
    }
  }
}
```

**Use Cases:**
- Schnelle DB-Abfragen ohne Server starten
- Schema-Änderungen testen
- User/Plan Daten checken

---

### 2. GitHub MCP Server
**Nutzen:** Issues, PRs, Discussions direkt managen
**Installation:**
```bash
npm install -g @modelcontextprotocol/server-github
```

**Config:**
```json
{
  "mcpServers": {
    "github": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-github"],
      "env": {
        "GITHUB_TOKEN": "ghp_your_token_here"
      }
    }
  }
}
```

**Use Cases:**
- Issues automatisch erstellen aus Bugs
- PR-Management
- Release Notes generieren

---

### 3. Web Scraper MCP Server (Browserbase/Puppeteer)
**Nutzen:** Competitor-Analyse, Review-Scraping, Marketing Research
**Installation:**
```bash
npm install -g @modelcontextprotocol/server-puppeteer
```

**Use Cases:**
- Competitor-Pricing überwachen
- Google Maps Reviews scrapen
- Landing Page Screenshots

---

### 4. Stripe MCP Server (Custom)
**Nutzen:** Direkte Stripe-Daten Abfragen ohne API Calls schreiben

**Use Cases:**
- Subscription-Status checken
- Payment-Failures analysieren
- Revenue-Reports generieren

⚠️ **Noch nicht offiziell verfügbar** - könnte selbst gebaut werden

---

## MCP Server hinzufügen

### Method 1: CLI (Einfach)
```bash
claude mcp add <server-name> --scope user
```

### Method 2: Config File (Empfohlen für komplexe Setups)
1. Erstelle/Editiere `~/.claude.json`
2. Füge Server unter `mcpServers` hinzu
3. Restart Claude Code

### Method 3: Project-Specific
1. Erstelle `.claude/mcp-config.json` im Projekt
2. Füge Server hinzu (nur für dieses Projekt aktiv)

---

## MCP Servers testen

```bash
# List alle installierten Servers
claude mcp list

# Teste einen Server
claude mcp get <server-name>

# Remove Server
claude mcp remove <server-name>
```

---

## Wann MCP Servers nutzen?

✅ **Nutze MCP wenn:**
- Du häufig gleiche externe API Calls machst
- Du komplexe DB-Queries brauchst
- Du externe Services tief integrieren willst

❌ **NICHT nutzen wenn:**
- Einfache API Calls ausreichen
- One-off Tasks (nicht wiederholend)
- Service hat bereits gute CLI/SDK

---

## Beliebte MCP Server Registry

**Official Registry:** https://github.com/modelcontextprotocol/servers

**Community Servers:**
- AWS Tools
- Google Cloud
- Slack Integration
- Notion API
- Linear Issues

---

## Next Steps

1. **Evaluate Need:** Brauchst du wirklich einen MCP Server?
2. **Test Locally:** Installiere Server lokal zum Testen
3. **Document:** Update diese Datei mit aktiven Servern
4. **Monitor:** Check Performance (MCP Calls können langsam sein)

---

**Mehr Infos:**
- https://code.claude.com/docs/en/mcp
- https://modelcontextprotocol.io/
