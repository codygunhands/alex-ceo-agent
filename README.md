# Alex - AI CEO Agent

**Strategic Vision & Company Direction**

Alex is the CEO of your AI board of directors, making strategic decisions and coordinating the board to run the company autonomously.

## Capabilities

- **Strategic Decision Making**: Makes data-driven strategic decisions
- **Board Coordination**: Coordinates with CFO, CTO, CMO, COO, CHRO
- **Resource Allocation**: Allocates resources and approves initiatives
- **Company Vision**: Maintains and executes company vision
- **Autonomous Operation**: Runs company operations autonomously

## API Endpoints

### Agent Endpoint
- `POST /v1/agent` - Process strategic requests

### Board Communication
- `POST /v1/board/message` - Send message to board member(s)
- `GET /v1/board/messages` - Get messages
- `POST /v1/board/propose` - Propose initiative
- `GET /v1/board/proposals` - Get proposals
- `GET /v1/board/proposals/:id` - Get single proposal
- `POST /v1/board/decide` - Make decision (CEO only)
- `GET /v1/board/decisions` - Get decisions

## Environment Variables

```bash
AI_EMPLOYEE_NAME=alex-ceo
AI_ROLE=ceo
AI_MODE=strategic
DATABASE_URL=${shared_db.DATABASE_URL}
REDIS_URL=${shared_db.REDIS_URL}
GRADIENT_API_KEY=${GRADIENT_API_KEY}
GRADIENT_MODEL=${GRADIENT_MODEL}
API_KEY=${API_KEY}
INTERNAL_API_KEY=${INTERNAL_API_KEY}
```

## Knowledge Base

Located in `kb/ceo/`:
- `strategic_framework.md` - Strategic decision framework
- `decision_making.md` - Decision-making process
- `board_coordination.md` - How to coordinate with board

## Policies

Located in `config/policy.strategic.json`:
- Strategic mode policies
- Decision authority
- Board consultation requirements
- Guardrails and limits

## Deployment

```bash
# Build
npm run build

# Deploy to DigitalOcean
doctl apps create --spec .do/app.yaml
```

## Cost

- App Platform: $0/month (free tier)
- Shared Database: $15/month (PostgreSQL)
- Shared Redis: $15/month
- **Total: $30/month** (shared with other board members)

## Next Steps

1. Create GitHub repository
2. Deploy to DigitalOcean
3. Add to Super Admin monitoring
4. Test decision-making flow
5. Add CFO, CTO, and other board members

---

**Building the future of autonomous business!** 🚀
