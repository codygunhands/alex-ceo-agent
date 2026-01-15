import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { AgentService } from '../services/agent-service';
import { AgentRequestSchema } from '../types';
import { z } from 'zod';

export async function agentRoutes(fastify: FastifyInstance) {
  const agentService = new AgentService();

  fastify.post('/v1/agent', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      // Rate limiting would be handled by middleware
      const body = AgentRequestSchema.parse(request.body);
      
      // Security check: marketing mode requires internal API key
      if (body.mode === 'marketing') {
        const apiKey = request.headers['x-api-key'] as string;
        const internalKey = process.env.INTERNAL_API_KEY || process.env.API_KEY;
        
        if (!apiKey || apiKey !== internalKey) {
          return reply.status(403).send({
            error: 'Marketing mode requires internal API key',
          });
        }
      }

      const response = await agentService.processRequest(body);
      
      return reply.send(response);
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

  fastify.get('/healthz', async (_request: FastifyRequest, reply: FastifyReply) => {
    return reply.send({ status: 'ok', timestamp: new Date().toISOString() });
  });
}

