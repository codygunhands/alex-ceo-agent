import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { PrismaClient } from '@prisma/client';
import { CreateLeadSchema, UpdateLeadStatusSchema, CreateTicketSchema } from '../types';
import { z } from 'zod';

export async function internalRoutes(fastify: FastifyInstance) {
  const prisma = new PrismaClient();
  const aiEmployee = process.env.AI_EMPLOYEE_NAME || 'jeff';

  // Middleware to check API key
  fastify.addHook('onRequest', async (request: FastifyRequest, reply: FastifyReply) => {
    const apiKey = request.headers['x-api-key'] as string;
    const requiredKey = process.env.API_KEY || process.env.INTERNAL_API_KEY;
    
    if (!apiKey || apiKey !== requiredKey) {
      return reply.status(401).send({
        error: 'Unauthorized - API key required',
      });
    }
  });

  fastify.post('/v1/leads', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const body = CreateLeadSchema.parse(request.body);
      
      const lead = await prisma.lead.create({
        data: {
          companyName: body.companyName,
          contactEmail: body.contactEmail,
          notes: body.notes,
          source: body.source,
          status: 'new',
        },
      });
      
      return reply.send(lead);
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

  fastify.patch('/v1/leads/:id', async (request: FastifyRequest<{ Params: { id: string }; Body: any }>, reply: FastifyReply) => {
    try {
      const { id } = request.params;
      const body = UpdateLeadStatusSchema.parse(request.body);
      
      const lead = await prisma.lead.update({
        where: { id },
        data: {
          status: body.status,
        },
      });
      
      return reply.send(lead);
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

  fastify.post('/v1/tickets', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const body = CreateTicketSchema.parse(request.body);
      
      const ticket = await prisma.ticket.create({
        data: {
          priority: body.priority,
          summary: body.summary,
          details: body.details,
          sessionId: body.sessionId,
          leadId: body.leadId,
          status: 'open',
        },
      });
      
      return reply.send(ticket);
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

  fastify.get('/v1/sessions/:id/audit', async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    try {
      const { id } = request.params;
      
      const auditLogs = await prisma.auditLog.findMany({
        where: { sessionId: id },
        orderBy: { createdAt: 'desc' },
        take: 100,
      });
      
      return reply.send({ auditLogs });
    } catch (error: any) {
      fastify.log.error(error);
      return reply.status(500).send({
        error: 'Internal server error',
      });
    }
  });

  // Graphics generation endpoint (MARKETING mode only)
  fastify.post('/v1/graphics/generate', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { GraphicsService } = await import('../services/graphics-service');
      const graphicsService = new GraphicsService();
      
      const result = await graphicsService.generate(request.body as any);
      
      // Return image as base64 or buffer
      reply.type('application/json');
      return reply.send({
        success: true,
        imageUrl: result.imageUrl,
        imageBase64: result.imageBuffer?.toString('base64'),
        metadata: result.metadata,
      });
    } catch (error: any) {
      fastify.log.error(error);
      return reply.status(500).send({
        error: 'Graphics generation failed',
        message: error.message,
      });
    }
  });

  // Screenshot endpoints
  fastify.post('/v1/screenshots/capture', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { ScreenshotService } = await import('../services/screenshot-service');
      const screenshotService = new ScreenshotService();
      
      const result = await screenshotService.captureUrl(request.body as any);
      
      reply.type('image/png');
      return reply.send(result.imageBuffer);
    } catch (error: any) {
      fastify.log.error(error);
      return reply.status(500).send({
        error: 'Screenshot capture failed',
        message: error.message,
      });
    }
  });

  fastify.post('/v1/screenshots/render', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { ScreenshotService } = await import('../services/screenshot-service');
      const screenshotService = new ScreenshotService();
      
      const result = await screenshotService.renderHtml(request.body as any);
      
      reply.type('image/png');
      return reply.send(result.imageBuffer);
    } catch (error: any) {
      fastify.log.error(error);
      return reply.status(500).send({
        error: 'HTML rendering failed',
        message: error.message,
      });
    }
  });
}

