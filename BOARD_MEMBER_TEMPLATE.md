# AI Board Member Template

Use this template to create new AI board members.

## Structure

Each board member is an AI employee with:
- Unique name and role
- Specific domain expertise
- Decision-making authority
- Communication capabilities
- Monitoring and oversight

## Template

### Basic Info
```yaml
name: "Alex"  # Board member name
role: "CEO"   # Board role
title: "Chief Executive Officer"
aiEmployee: "alex-ceo"
```

### Responsibilities
```markdown
- Strategic vision
- Company direction
- Major decisions
- Resource allocation
```

### Capabilities
```markdown
- Can approve/reject initiatives
- Can hire/fire employees
- Can allocate resources
- Can make strategic decisions
```

### Knowledge Base
```markdown
- business_strategy.md
- market_analysis.md
- company_goals.md
- decision_framework.md
```

### Policies
```json
{
  "mode": "strategic",
  "allowedActions": [
    "approve_initiative",
    "reject_initiative",
    "hire_employee",
    "allocate_resources",
    "set_strategy"
  ],
  "guardrails": {
    "maxSpending": 10000,
    "requiresApproval": ["major_pivot", "hiring", "investment"]
  }
}
```

### Environment Variables
```bash
AI_EMPLOYEE_NAME=alex-ceo
AI_ROLE=ceo
AI_MODE=strategic
DATABASE_URL=${shared_db.DATABASE_URL}
REDIS_URL=${shared_db.REDIS_URL}
```

### Communication
- Can message other board members via API
- Decisions logged to shared database
- Actions tracked in audit log

## Example: CEO (Alex)

### Prisma Schema
```prisma
model BoardDecision {
  id          String   @id @default(uuid())
  boardMember String   // "alex-ceo", "finley-cfo", etc.
  decision    String   // "approve", "reject", "defer"
  proposal    String   @db.Text
  reasoning   String?  @db.Text
  impact      Json?    // Estimated impact
  status      String   @default("pending") // "pending", "approved", "rejected"
  createdAt   DateTime @default(now())
  executedAt  DateTime?
  
  @@index([boardMember])
  @@index([status])
}
```

### API Endpoints
```typescript
// Propose initiative
POST /v1/board/propose
{
  "initiative": "Hire Support AI",
  "reasoning": "Support tickets increasing",
  "impact": { "cost": 30, "benefit": "high" }
}

// Review proposal
GET /v1/board/proposals
GET /v1/board/proposals/:id

// Make decision
POST /v1/board/decide
{
  "proposalId": "...",
  "decision": "approve",
  "reasoning": "..."
}

// Communicate with board
POST /v1/board/message
{
  "to": "finley-cfo",
  "message": "Can we afford this?",
  "context": { "proposalId": "..." }
}
```

### Decision Logic
```typescript
async function makeDecision(proposal: Proposal): Promise<Decision> {
  // Get relevant board member input
  const financialImpact = await getCFOInput(proposal);
  const technicalFeasibility = await getCTOInput(proposal);
  const operationalImpact = await getCOOInput(proposal);
  
  // Analyze
  const analysis = analyzeProposal({
    proposal,
    financialImpact,
    technicalFeasibility,
    operationalImpact
  });
  
  // Make decision
  const decision = analysis.score > 70 ? 'approve' : 'reject';
  
  // Log decision
  await logDecision({
    boardMember: 'alex-ceo',
    proposal,
    decision,
    reasoning: analysis.reasoning
  });
  
  return decision;
}
```

## Creating a New Board Member

1. **Copy Template**
   ```bash
   cp -r jeff-ai-agent alex-ceo-agent
   cd alex-ceo-agent
   ```

2. **Update Configuration**
   - Update `AI_EMPLOYEE_NAME=alex-ceo`
   - Update knowledge base
   - Update policies
   - Update capabilities

3. **Deploy**
   - Uses shared databases
   - Unique app instance
   - Unique knowledge base

4. **Integrate**
   - Add to Super Admin monitoring
   - Enable board communication
   - Set up decision logging

## Board Communication Protocol

### Message Format
```typescript
interface BoardMessage {
  from: string;      // "alex-ceo"
  to: string;        // "finley-cfo" | "all"
  type: string;      // "question" | "proposal" | "decision" | "alert"
  subject: string;
  body: string;
  context?: {
    proposalId?: string;
    decisionId?: string;
    metric?: string;
  };
  priority: "low" | "medium" | "high" | "urgent";
  createdAt: Date;
}
```

### Decision Flow
1. **Proposal Created** → CEO
2. **CEO Reviews** → Requests input from relevant board members
3. **Board Members Respond** → Provide analysis
4. **CEO Decides** → Approve/Reject/Defer
5. **Decision Executed** → If approved, relevant board member executes
6. **Results Tracked** → Impact measured and logged

## Next Steps

1. Create CEO (Alex) first
2. Create CFO (Finley) second
3. Create CTO (Taylor) third
4. Enable board communication
5. Test decision-making flow
6. Add remaining board members
7. Enable full autonomy

