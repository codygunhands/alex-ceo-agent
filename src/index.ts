import Fastify, { FastifyRequest, FastifyReply } from 'fastify';
import { agentRoutes } from './routes/agent';
import { internalRoutes } from './routes/internal';
import { boardRoutes } from './routes/board';
import { migrationRoutes } from './routes/migrations';

const fastify = Fastify({
  logger: {
    level: process.env.LOG_LEVEL || 'info',
    transport: process.env.NODE_ENV === 'development' ? {
      target: 'pino-pretty',
      options: {
        colorize: true,
      },
    } : undefined,
  },
});

// Register routes
fastify.register(agentRoutes);
fastify.register(internalRoutes, { prefix: '/internal' });
fastify.register(boardRoutes);
fastify.register(migrationRoutes);

// Rate limiting middleware (simple in-memory for now)
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_WINDOW = 60000; // 1 minute
const RATE_LIMIT_MAX = 60; // 60 requests per minute

fastify.addHook('onRequest', async (request: FastifyRequest, reply: FastifyReply) => {
  const forwardedFor = request.headers['x-forwarded-for'];
  const ipStr = request.ip || (Array.isArray(forwardedFor) ? forwardedFor[0] : forwardedFor) || 'unknown';
  const ip = typeof ipStr === 'string' ? ipStr : 'unknown';
  const now = Date.now();
  
  const limit = rateLimitMap.get(ip);
  if (limit) {
    if (now > limit.resetAt) {
      rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW });
    } else {
      if (limit.count >= RATE_LIMIT_MAX) {
        return reply.status(429).send({
          error: 'Rate limit exceeded',
        });
      }
      limit.count++;
    }
  } else {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW });
  }
});

const start = async () => {
  try {
    // Run migrations on startup if DATABASE_URL is set
    if (process.env.DATABASE_URL && process.env.DATABASE_URL !== 'postgresql://dummy:dummy@dummy:5432/dummy') {
      try {
        fastify.log.info('Running database migrations on startup...');
        const { execSync } = require('child_process');
        execSync('npx prisma migrate deploy', {
          encoding: 'utf-8',
          env: { ...process.env },
          stdio: 'inherit',
          timeout: 60000,
        });
        fastify.log.info('✅ Migrations completed');
      } catch (migrationError: any) {
        fastify.log.warn('⚠️  Migrations failed (will retry via endpoint):', migrationError.message);
        // Don't exit - app can still run, migrations can be run manually
      }
    }
    
    const port = parseInt(process.env.PORT || '3000', 10);
    const host = process.env.HOST || '0.0.0.0';
    
    await fastify.listen({ port, host });
    const agentName = process.env.AI_EMPLOYEE_NAME || 'alex-ceo';
    const agentRole = process.env.AI_ROLE || 'CEO';
    fastify.log.info(`${agentRole} AI Agent (${agentName}) server listening on ${host}:${port}`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();

