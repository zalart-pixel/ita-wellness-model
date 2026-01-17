# UDENSROZE Development Environment Setup

Setup completed: 2026-01-17

## Environment Location
- **Project Directory**: `/root/udensroze/`
- **Database**: `/root/udensroze/data/udensroze.db`

## MCP Servers Configured
| Server | Package | Purpose |
|--------|---------|---------|
| sequential-thinking | @modelcontextprotocol/server-sequential-thinking | Complex reasoning |
| filesystem | @modelcontextprotocol/server-filesystem | File operations |
| memory | @modelcontextprotocol/server-memory | Persistent memory |
| fetch | @modelcontextprotocol/server-fetch | HTTP requests |
| sqlite | @modelcontextprotocol/server-sqlite | Database access |
| playwright | @anthropics/mcp-server-playwright | Browser automation |
| context7 | @upstash/context7-mcp | Documentation search |
| github | @modelcontextprotocol/server-github | GitHub integration |

## Database Schema
```sql
-- 5 Tables
tasks (id, domain, title, priority, owner, effort_hours, success_criteria, status)
decisions (id, question, options, decision_maker, deadline, decision)
properties (id, url, title, price, location, area_built, area_land, score, status)
investors (id, name, type, focus, check_size_min, check_size_max, contact_email, status)
customer_validation (id, type, name, contact, status)
```

## Task Summary
- **Total Tasks**: 59
- **Critical**: 23 | **High**: 22 | **Medium**: 13 | **Low**: 1
- **Pending Decisions**: 12

## Directory Structure
```
~/udensroze/
├── .claude/
│   ├── skills/        # 8 custom skills
│   └── agents/        # 3 subagents
├── config/
├── data/
│   ├── properties/
│   ├── investors/
│   └── financials/
├── docs/
│   ├── investor-materials/
│   ├── legal/
│   └── clinical/
├── exports/
│   ├── excel/
│   ├── pdf/
│   └── presentations/
├── logs/
└── scripts/
    ├── scrapers/
    ├── automation/
    └── analysis/
```

## Custom Skills
1. `customer-validation.md` - CV tasks (deposits, LOIs, surveys)
2. `medical-credentials.md` - MD tasks (CV, licenses, outcomes)
3. `financial-model.md` - FM tasks (Excel model, cap table)
4. `gtm-strategy.md` - GTM tasks (marketing, brand, website)
5. `regulatory-pathway.md` - REG tasks (ASL, peptides, legal)
6. `property-acquisition.md` - PROP tasks (masseria search, DD)
7. `investor-relations.md` - GOV tasks (partnership, fundraising)
8. `task-tracking.md` - DOC tasks (progress tracking)

## Subagents
1. `property-scout.md` - Autonomous property search
2. `investor-researcher.md` - Investor profiling
3. `task-master.md` - Task coordination

## Python Packages Installed
- pandas, openpyxl, xlsxwriter (spreadsheets)
- python-docx, python-pptx (documents)
- playwright, beautifulsoup4 (web scraping)
- httpx, requests (HTTP)
- numpy-financial (financial calculations)
- sqlite-utils (database)

## Pending Setup
- [ ] GitHub token (https://github.com/settings/tokens)
- [ ] Docker for local n8n (optional)
