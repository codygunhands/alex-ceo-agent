import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { AgentService } from '../services/agent-service';
import { AgentRequestSchema } from '../types';
import { z } from 'zod';

export async function agentRoutes(fastify: FastifyInstance) {
  // Lazy initialization - don't create AgentService until first request
  // This prevents route registration failures if constructor throws errors
  let agentService: AgentService | null = null;

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

      // Lazy initialization - create service on first request
      if (!agentService) {
        try {
          agentService = new AgentService();
        } catch (initError: any) {
          fastify.log.error('Failed to initialize AgentService:', initError);
          return reply.status(500).send({
            error: 'Service initialization failed',
            message: initError.message || 'Failed to initialize agent service. Check DATABASE_URL, GRADIENT_API_KEY, and GRADIENT_MODEL environment variables.',
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
      
      fastify.log.error('Agent request error:', error);
      if (error.stack) {
        fastify.log.error('Stack trace:', error.stack);
      }
      return reply.status(500).send({
        error: 'Internal server error',
        message: error.message || 'An unexpected error occurred',
      });
    }
  });

  fastify.get('/healthz', async (_request: FastifyRequest, reply: FastifyReply) => {
    return reply.send({ status: 'ok', timestamp: new Date().toISOString() });
  });
}

