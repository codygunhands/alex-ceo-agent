import { Queue, Worker } from 'bullmq';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const aiEmployee = process.env.AI_EMPLOYEE_NAME || 'jeff';
const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

// Connection options for BullMQ
const connection = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD,
  // Parse Redis URL if provided
  ...(redisUrl.startsWith('redis://') || redisUrl.startsWith('rediss://') ? {} : {}),
};

// Parse Redis URL
if (redisUrl.startsWith('redis://') || redisUrl.startsWith('rediss://')) {
  try {
    const url = new URL(redisUrl);
    connection.host = url.hostname;
    connection.port = parseInt(url.port || '6379');
    if (url.password) connection.password = url.password;
  } catch (e) {
    // Use defaults if URL parsing fails
  }
}

// Queue definitions (namespaced by AI employee)
const leadScoringQueue = new Queue(`${aiEmployee}:lead_scoring`, { connection });
const ticketEnrichmentQueue = new Queue(`${aiEmployee}:ticket_enrichment`, { connection });
const followupDraftQueue = new Queue(`${aiEmployee}:followup_draft`, { connection });
const marketingBatchQueue = new Queue(`${aiEmployee}:marketing_batch`, { connection });

// Lead scoring worker
const leadScoringWorker = new Worker(
  `${aiEmployee}:lead_scoring`,
  async (job) => {
    const { leadId } = job.data;
    
    const lead = await prisma.lead.findFirst({
      where: { 
        id: leadId,
        aiEmployee: aiEmployee, // Filter by AI employee
      },
    });
    
    if (!lead) {
      throw new Error(`Lead ${leadId} not found`);
    }
    
    // Rules-based scoring
    let score = 0;
    
    if (lead.companyName) score += 20;
    if (lead.contactEmail) score += 20;
    if (lead.notes && lead.notes.length > 50) score += 20;
    if (lead.source === 'sales') score += 20;
    if (lead.source === 'onboarding') score += 10;
    
    await prisma.lead.updateMany({
      where: { 
        id: leadId,
        aiEmployee: aiEmployee, // Filter by AI employee
      },
      data: {
        qualificationScore: score,
        status: score >= 60 ? 'qualified' : 'new',
      },
    });
    
    return { leadId, score };
  },
  { connection }
);

// Ticket enrichment worker
const ticketEnrichmentWorker = new Worker(
  `${aiEmployee}:ticket_enrichment`,
  async (job) => {
    const { ticketId } = job.data;
    
    const ticket = await prisma.ticket.findFirst({
      where: { 
        id: ticketId,
        aiEmployee: aiEmployee, // Filter by AI employee
      },
      include: {
        session: {
          include: {
            messages: {
              orderBy: { createdAt: 'asc' },
              take: 20,
            },
          },
        },
      },
    });
    
    if (!ticket) {
      throw new Error(`Ticket ${ticketId} not found`);
    }
    
    // Summarize conversation
    let summary = ticket.summary;
    if (ticket.session?.messages) {
      const conversation = ticket.session.messages
        .map(m => `${m.role}: ${m.content}`)
        .join('\n');
      
      summary = `${ticket.summary}\n\nConversation Summary:\n${conversation}`;
    }
    
    // Suggested repro steps (placeholder - would use LLM in production)
    const suggestedRepro = ticket.details.includes('error') 
      ? 'Please check error logs and provide specific error messages.'
      : 'Unknown - requires investigation.';
    
    await prisma.ticket.updateMany({
      where: { 
        id: ticketId,
        aiEmployee: aiEmployee, // Filter by AI employee
      },
      data: {
        details: summary,
      },
    });
    
    return { ticketId, summary, suggestedRepro };
  },
  { connection }
);

// Follow-up draft worker (operator mode only)
const followupDraftWorker = new Worker(
  `${aiEmployee}:followup_draft`,
  async (job) => {
    const { sessionId, type } = job.data;
    
    const session = await prisma.session.findFirst({
      where: { 
        id: sessionId,
        aiEmployee: aiEmployee, // Filter by AI employee
      },
    });
    
    if (!session || session.mode !== 'operator') {
      throw new Error('Follow-up drafts only for operator mode');
    }
    
    // Get last message
    const lastMessage = await prisma.message.findFirst({
      where: {
        sessionId: sessionId,
        aiEmployee: aiEmployee,
      },
      orderBy: { createdAt: 'desc' },
    });
    const draft = `Follow-up email draft for session ${sessionId}:\n\nSubject: Following up on our conversation\n\nHi,\n\nI wanted to follow up on our recent conversation about [topic]. [Draft content based on conversation].\n\nBest regards,\nJeff`;
    
    return { sessionId, draft, type };
  },
  { connection }
);

// Marketing batch worker
const marketingBatchWorker = new Worker(
  `${aiEmployee}:marketing_batch`,
  async (job) => {
    const { type, params } = job.data;
    
    if (type === 'calendar') {
      // Create content calendar
      const calendar = {
        weeks: 4,
        topics: ['Product updates', 'Case studies', 'How-to guides', 'Industry insights'],
        channels: ['blog', 'email', 'social'],
      };
      
      return { type: 'calendar', calendar };
    } else if (type === 'multi_asset') {
      // Create multiple assets
      const assets = [
        { type: 'post', topic: params.topic },
        { type: 'email', topic: params.topic },
        { type: 'ad_copy', topic: params.topic },
      ];
      
      return { type: 'multi_asset', assets };
    }
    
    throw new Error(`Unknown batch type: ${type}`);
  },
  { connection }
);

console.log('Jeff AI Agent workers started');

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('Shutting down workers...');
  await leadScoringWorker.close();
  await ticketEnrichmentWorker.close();
  await followupDraftWorker.close();
  await marketingBatchWorker.close();
  await prisma.$disconnect();
  process.exit(0);
});

