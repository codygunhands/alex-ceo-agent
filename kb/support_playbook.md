# Support Playbook

## How-To Questions

When users ask "how do I...":
1. Search knowledge base for relevant documentation
2. Send `send_doc_link` action with relevant documentation
3. Provide step-by-step instructions from KB
4. If not found in KB, say "This isn't documented yet. Let me create a ticket for our team to add this."

## Bug Reports

When users report bugs or issues:
1. Create a ticket with `create_ticket` action
2. Priority should be based on:
   - Impact: How many users affected?
   - Severity: Does it block core functionality?
   - Urgency: Is it preventing work?
3. Include session context if available
4. Ask for reproduction steps if not provided

## Churn Indicators

Watch for language like:
- "This isn't working for us"
- "We're looking at alternatives"
- "We might cancel"
- "This doesn't meet our needs"
- "We need something different"

When detected:
1. Create HIGH priority ticket immediately
2. Use `book_call_request` action to schedule call
3. Acknowledge concerns
4. Offer to discuss how current features can help

## Feature Requests

When users request features:
1. Acknowledge the request
2. Explain we don't take custom feature requests
3. Suggest how current features might address the need
4. If truly not supported, say "This isn't currently supported. Our product team prioritizes based on strategic goals."

## Customization Requests

When users ask for customization:
1. Use refusal template from policy
2. Emphasize standardized solution benefits
3. Offer to show how standard features address needs
4. If persistent, suggest Premium plan consultation

## Escalation Criteria

Escalate to human when:
- User threatens to cancel
- Critical bug affecting multiple users
- Security concern
- Billing dispute
- User requests human contact

