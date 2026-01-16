import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';

const prisma = new PrismaClient();
const aiEmployee = process.env.AI_EMPLOYEE_NAME || 'alex-ceo';

// Message schema
const MessageSchema = z.object({
  to: z.string(),
  message: z.string(),
  type: z.enum(['question', 'proposal', 'decision', 'alert', 'update']).optional(),
  context: z.record(z.any()).optional(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
});

// Proposal schema
const ProposalSchema = z.object({
  initiative: z.string(),
  reasoning: z.string(),
  impact: z.object({
    cost: z.number().optional(),
    benefit: z.enum(['low', 'medium', 'high']).optional(),
    urgency: z.enum(['low', 'medium', 'high']).optional(),
    risk: z.enum(['low', 'medium', 'high']).optional(),
  }).optional(),
});

// Decision schema
const DecisionSchema = z.object({
  proposalId: z.string(),
  decision: z.enum(['approve', 'reject', 'defer']),
  reasoning: z.string(),
});

export async function boardRoutes(fastify: FastifyInstance) {
  // Send message to board member(s)
  fastify.post('/v1/board/message', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const body = MessageSchema.parse(request.body);
      
      const message = await prisma.boardMessage.create({
        data: {
          from: aiEmployee,
          to: body.to,
          message: body.message,
          type: body.type || 'update',
          context: body.context || {},
          priority: body.priority || 'medium',
        },
      });
      
      // Send message to board member(s) via API
      try {
        const { sendBoardMessage } = await import('../services/board-communication');
        const result = await sendBoardMessage(
          body.to,
          body.message,
          body.type || 'update',
          body.context,
          body.priority || 'medium'
        );
        
        if (!result.success) {
          fastify.log.warn(`Failed to deliver message to ${body.to}: ${result.error}`);
        } else {
          fastify.log.info(`Message delivered to ${body.to}: ${body.message.substring(0, 50)}...`);
        }
      } catch (error: any) {
        fastify.log.error(`Error sending board message: ${error.message}`);
        // Don't fail the request - message is still stored in DB
      }
      
      return reply.send(message);
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({
          error: 'Invalid request',
          details: error.errors,
        });
      }
      
      fastify.log.error(error);
      return reply.status(500).send({
        error: 'Internal server error',
      });
    }
  });

  // Get messages
  fastify.get('/v1/board/messages', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const messages = await prisma.boardMessage.findMany({
        where: {
          OR: [
            { to: aiEmployee },
            { to: 'all' },
            { from: aiEmployee },
          ],
        },
        orderBy: { createdAt: 'desc' },
        take: 100,
      });
      
      return reply.send({ messages });
    } catch (error: any) {
      fastify.log.error(error);
      return reply.status(500).send({
        error: 'Internal server error',
      });
    }
  });

  // Propose initiative
  fastify.post('/v1/board/propose', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const body = ProposalSchema.parse(request.body);
      
      const proposal = await prisma.boardProposal.create({
        data: {
          boardMember: aiEmployee,
          initiative: body.initiative,
          reasoning: body.reasoning,
          impact: body.impact || {},
          status: 'pending',
        },
      });
      
      // If not CEO, notify CEO
      if (aiEmployee !== 'alex-ceo') {
        await prisma.boardMessage.create({
          data: {
            from: aiEmployee,
            to: 'alex-ceo',
            message: `New proposal: ${body.initiative}`,
            type: 'proposal',
            context: { proposalId: proposal.id },
            priority: 'high',
          },
        });
      }
      
      return reply.send(proposal);
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({
          error: 'Invalid request',
          details: error.errors,
        });
      }
      
      fastify.log.error(error);
      return reply.status(500).send({
        error: 'Internal server error',
      });
    }
  });

  // Get proposals
  fastify.get('/v1/board/proposals', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const status = (request.query as any)?.status || 'pending';
      
      const proposals = await prisma.boardProposal.findMany({
        where: {
          status: status === 'all' ? undefined : status,
        },
        orderBy: { createdAt: 'desc' },
        take: 50,
      });
      
      return reply.send({ proposals });
    } catch (error: any) {
      fastify.log.error(error);
      return reply.status(500).send({
        error: 'Internal server error',
      });
    }
  });

  // Get single proposal
  fastify.get('/v1/board/proposals/:id', async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    try {
      const { id } = request.params;
      
      const proposal = await prisma.boardProposal.findUnique({
        where: { id },
      });
      
      if (!proposal) {
        return reply.status(404).send({
          error: 'Proposal not found',
        });
      }
      
      return reply.send(proposal);
    } catch (error: any) {
      fastify.log.error(error);
      return reply.status(500).send({
        error: 'Internal server error',
      });
    }
  });

  // Make decision (CEO only)
  fastify.post('/v1/board/decide', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      // Only CEO can make decisions
      if (aiEmployee !== 'alex-ceo') {
        return reply.status(403).send({
          error: 'Only CEO can make decisions',
        });
      }
      
      const body = DecisionSchema.parse(request.body);
      
      // Update proposal
      const proposal = await prisma.boardProposal.update({
        where: { id: body.proposalId },
        data: {
          status: body.decision === 'approve' ? 'approved' : body.decision === 'reject' ? 'rejected' : 'deferred',
          decidedAt: new Date(),
          decidedBy: aiEmployee,
          decisionReasoning: body.reasoning,
        },
      });
      
      // Create decision record
      const decision = await prisma.boardDecision.create({
        data: {
          proposalId: body.proposalId,
          boardMember: aiEmployee,
          decision: body.decision,
          reasoning: body.reasoning,
          status: body.decision === 'approve' ? 'pending' : 'completed',
        },
      });
      
      // Notify proposal creator
      await prisma.boardMessage.create({
        data: {
          from: aiEmployee,
          to: proposal.boardMember,
          message: `Decision on "${proposal.initiative}": ${body.decision.toUpperCase()}`,
          type: 'decision',
          context: { proposalId: body.proposalId, decisionId: decision.id },
          priority: 'high',
        },
      });
      
      return reply.send({ proposal, decision });
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({
          error: 'Invalid request',
          details: error.errors,
        });
      }
      
      fastify.log.error(error);
      return reply.status(500).send({
        error: 'Internal server error',
      });
    }
  });

  // Get decisions
  fastify.get('/v1/board/decisions', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const decisions = await prisma.boardDecision.findMany({
        orderBy: { createdAt: 'desc' },
        take: 50,
        include: {
          proposal: true,
        },
      });
      
      return reply.send({ decisions });
    } catch (error: any) {
      fastify.log.error(error);
      return reply.status(500).send({
        error: 'Internal server error',
      });
    }
  });
}

