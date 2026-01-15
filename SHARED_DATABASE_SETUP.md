# Shared Database Setup Guide

## Overview

This guide shows how to set up shared databases for all AI employees, reducing costs from $30/month per AI to $30/month total.

## Step 1: Create Shared Databases

Run the script to create shared PostgreSQL and Redis databases:

```bash
cd jeff-ai-agent
node scripts/create-shared-databases.js
```

This will:
- Create `ai-employees-db` (PostgreSQL) - $15/month
- Create `ai-employees-redis` (Redis/Valkey) - $15/month
- Wait for databases to be ready
- Display connection strings

**Save the connection strings!** You'll need them for all AI employees.

## Step 2: Update Jeff to Use Shared Databases

### 2.1 Update Prisma Schema

The schema has been updated to include `aiEmployee` field in all models:
- `Session.aiEmployee`
- `Message.aiEmployee`
- `Lead.aiEmployee`
- `Ticket.aiEmployee`
- `AuditLog.aiEmployee`
- `Draft.aiEmployee`

### 2.2 Run Migrations

```bash
cd jeff-ai-agent
npm run prisma:migrate
```

Or use the migration script:

```bash
node scripts/migrate-to-shared-database.js
```

### 2.3 Update Environment Variables

In DigitalOcean App Platform → Jeff → Settings → Environment Variables:

**Add/Update:**
```
DATABASE_URL=<shared-postgresql-connection-string>
REDIS_URL=<shared-redis-connection-string>
AI_EMPLOYEE_NAME=jeff
```

### 2.4 Update Code

The code has been updated to:
- Filter queries by `aiEmployee`
- Use namespaced Redis keys
- Set `aiEmployee` on all new records

### 2.5 Deploy

```bash
git add .
git commit -m "Update to use shared databases"
git push origin main
```

## Step 3: Create New AI Employees

### 3.1 Copy Jeff's Structure

```bash
cp -r jeff-ai-agent sales-ai-agent
cd sales-ai-agent
```

### 3.2 Update Configuration

**Update `.do/app.yaml`:**
- Change `name: sales-ai-agent`
- Use same database references: `${db.DATABASE_URL}` and `${redis.REDIS_URL}`

**Update Environment Variables:**
```
AI_EMPLOYEE_NAME=sales
```

**Update Knowledge Base:**
- Replace marketing playbook with sales playbook
- Update policies for sales-specific behavior

**Update Policies:**
- `config/policy.sales.json` (create new)
- Define sales-specific guardrails

### 3.3 Deploy

```bash
git init
git add .
git commit -m "Initial commit: Sales AI"
git remote add origin <your-repo-url>
git push -u origin main
```

Then deploy via DigitalOcean API or dashboard.

## Step 4: Verify Shared Database Usage

### Check Database Connections

All AI employees should connect to the same databases:
- Same `DATABASE_URL`
- Same `REDIS_URL`
- Different `AI_EMPLOYEE_NAME`

### Verify Data Isolation

Each AI employee's data is isolated by `aiEmployee` field:
- Jeff's sessions: `aiEmployee = 'jeff'`
- Sales AI's sessions: `aiEmployee = 'sales'`
- Support AI's sessions: `aiEmployee = 'support'`

### Check Redis Namespacing

Redis keys are namespaced:
- Jeff: `jeff:sessions:*`, `jeff:jobs:*`
- Sales: `sales:sessions:*`, `sales:jobs:*`
- Support: `support:sessions:*`, `support:jobs:*`

## Cost Savings

### Before (Separate Databases)
- Jeff: $30/month
- Sales AI: $30/month
- Support AI: $30/month
- Operations AI: $30/month
- **Total: $120/month**

### After (Shared Databases)
- 4 AI Apps: $0/month (free tier)
- 1 Shared PostgreSQL: $15/month
- 1 Shared Redis: $15/month
- **Total: $30/month**

**Savings: $90/month (75% reduction)**

## Troubleshooting

### "Database connection failed"
- Check `DATABASE_URL` is correct
- Verify database is online
- Check firewall rules

### "Redis connection failed"
- Check `REDIS_URL` is correct
- Verify Redis is online
- Check connection string format

### "Data from other AI employees showing"
- Verify `AI_EMPLOYEE_NAME` is set correctly
- Check queries filter by `aiEmployee`
- Verify Redis keys are namespaced

### "Migration failed"
- Check database permissions
- Verify schema is correct
- Check for existing `aiEmployee` column

## Next Steps

1. ✅ Create shared databases
2. ✅ Update Jeff to use shared databases
3. ✅ Test thoroughly
4. ⏳ Create Sales AI employee
5. ⏳ Create Support AI employee
6. ⏳ Create Operations AI employee

## Notes

- All AI employees share the same database infrastructure
- Data is isolated by `aiEmployee` field
- Redis keys are namespaced to prevent collisions
- Each AI can only see their own data
- Super Admin can see all data (for monitoring)

