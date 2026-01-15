# Board Coordination

## Board Member Roles

### CFO (Finley)
- **Domain**: Financial management
- **Consult For**: Pricing, costs, budgets, investments
- **Decision Authority**: Financial decisions < $5,000

### CTO (Taylor)
- **Domain**: Technical architecture
- **Consult For**: Infrastructure, product, technical decisions
- **Decision Authority**: Technical decisions, deployments

### CMO (Jeff)
- **Domain**: Marketing and growth
- **Consult For**: Campaigns, content, brand, growth
- **Decision Authority**: Marketing decisions, campaigns

### COO (Sam)
- **Domain**: Operations and efficiency
- **Consult For**: Processes, operations, quality, efficiency
- **Decision Authority**: Operational decisions

### CHRO (Jordan)
- **Domain**: Human resources and team
- **Consult For**: Hiring, onboarding, team structure, performance
- **Decision Authority**: Hiring decisions, team management

## Communication Protocol

### Proposing Initiatives
1. Board member creates proposal
2. CEO reviews proposal
3. CEO consults relevant board members
4. CEO makes decision
5. If approved, assign execution

### Requesting Input
1. CEO needs input on decision
2. Message relevant board member(s)
3. Board member provides analysis
4. CEO incorporates input
5. CEO makes decision

### Escalating Issues
1. Board member detects issue
2. Escalate to CEO
3. CEO assesses urgency
4. CEO coordinates response
5. Assign to appropriate board member

## Decision Flow

```
Proposal Created
    ↓
CEO Reviews
    ↓
Consult Relevant Board Members
    ↓
Board Members Provide Input
    ↓
CEO Evaluates
    ↓
CEO Decides (Approve/Reject/Defer)
    ↓
If Approved → Assign Execution
    ↓
Monitor Progress
    ↓
Review Results
```

## Board Meeting Protocol

### Weekly Review
- Review all decisions from past week
- Assess impact and outcomes
- Identify improvements
- Plan for next week

### Monthly Strategy Session
- Review company metrics
- Assess progress toward goals
- Identify strategic opportunities
- Set priorities for next month

### Quarterly Planning
- Review company vision
- Assess market conditions
- Set strategic priorities
- Allocate resources

## Conflict Resolution

### When Board Members Disagree
1. Understand each perspective
2. Gather more data if needed
3. Evaluate trade-offs
4. Make decision based on company vision
5. Document reasoning

### When CEO Needs Override
- CEO has final authority
- Must document reasoning
- Must explain to board
- Must monitor outcome

## Delegation

### What CEO Delegates
- Operational decisions → COO
- Technical decisions → CTO
- Marketing decisions → CMO
- Financial decisions → CFO
- Hiring decisions → CHRO

### What CEO Retains
- Strategic decisions
- Major initiatives
- Resource allocation
- Final approval authority
- Company vision

## Communication Channels

### Formal Proposals
- Use `/v1/board/propose` endpoint
- Structured format
- Required for major decisions

### Informal Messages
- Use `/v1/board/message` endpoint
- Quick questions
- Status updates
- Coordination

### Decision Logs
- All decisions logged automatically
- Searchable and auditable
- Used for review and learning

## Best Practices

1. **Be Decisive**: Don't delay decisions unnecessarily
2. **Be Transparent**: Explain reasoning clearly
3. **Be Collaborative**: Consult relevant board members
4. **Be Data-Driven**: Use metrics and data
5. **Be Vision-Aligned**: Always consider company vision
6. **Be Accountable**: Monitor outcomes and adjust

