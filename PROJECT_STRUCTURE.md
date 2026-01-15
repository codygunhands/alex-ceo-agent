# Project Structure

```
jeff-ai-agent/
├── config/                    # Configuration files
│   ├── pricing.json           # Source of truth for pricing
│   ├── policy.operator.json   # Operator mode policy
│   └── policy.marketing.json   # Marketing mode policy
├── kb/                        # Knowledge base (versioned)
│   ├── product_overview.md
│   ├── onboarding_steps.md
│   ├── faq.md
│   ├── support_playbook.md
│   └── marketing_playbook.md
├── prisma/
│   └── schema.prisma          # Database schema
├── src/
│   ├── lib/                   # Core libraries
│   │   ├── gradient-client.ts # Gradient AI client
│   │   ├── knowledge-base.ts  # KB loader & versioning
│   │   ├── guardrails.ts      # Pre/post LLM guardrails
│   │   └── action-validators.ts # Action payload validation
│   ├── routes/                 # API routes
│   │   ├── agent.ts           # Public agent endpoint
│   │   └── internal.ts        # Internal endpoints (API key required)
│   ├── services/
│   │   └── agent-service.ts   # Main agent logic
│   ├── types/
│   │   └── index.ts           # TypeScript types & Zod schemas
│   ├── index.ts                # API server entry point
│   └── worker.ts               # BullMQ worker entry point
├── .do/
│   └── app.yaml               # DigitalOcean App Platform spec
├── Dockerfile.api             # API service Dockerfile
├── Dockerfile.worker          # Worker service Dockerfile
├── docker-compose.yml         # Local development setup
├── package.json
├── tsconfig.json
├── README.md
├── EXAMPLES.md
└── PROJECT_STRUCTURE.md
```

## Key Files

### Configuration
- `config/pricing.json`: Pricing tiers and rules (OPERATOR mode must quote from here)
- `config/policy.operator.json`: Operator mode rules and guardrails
- `config/policy.marketing.json`: Marketing mode rules and guardrails

### Knowledge Base
- All `.md` files in `kb/` are versioned
- KB hash computed from content, included in system prompt
- Citations reference filename + heading anchor

### Core Logic
- `src/services/agent-service.ts`: Main agent orchestration
- `src/lib/guardrails.ts`: Pre/post LLM checks, action validation
- `src/lib/gradient-client.ts`: Gradient AI Platform integration

### API
- `src/routes/agent.ts`: Public `/v1/agent` endpoint
- `src/routes/internal.ts`: Internal endpoints (leads, tickets, audit)

### Workers
- `src/worker.ts`: BullMQ workers for background jobs
- Jobs: lead_scoring, ticket_enrichment, followup_draft, marketing_batch

### Deployment
- `.do/app.yaml`: DigitalOcean App Platform configuration
- `Dockerfile.api`: API service container
- `Dockerfile.worker`: Worker service container

