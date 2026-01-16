import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { execSync } from 'child_process';

export async function migrationRoutes(fastify: FastifyInstance) {
  // Internal endpoint to run migrations
  fastify.post('/internal/migrate', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      // Check for internal API key
      const apiKey = request.headers['x-api-key'] as string;
      const internalKey = process.env.INTERNAL_API_KEY || process.env.API_KEY;
      
      if (!apiKey || apiKey !== internalKey) {
        return reply.status(403).send({
          error: 'Unauthorized - Internal API key required',
        });
      }

      fastify.log.info('Running database migrations...');
      
      try {
        // Run Prisma migrations
        const output = execSync('npx prisma migrate deploy', {
          encoding: 'utf-8',
          env: { ...process.env },
          timeout: 60000, // 60 second timeout
        });
        
        fastify.log.info('Migrations completed successfully');
        
        return reply.send({
          success: true,
          message: 'Migrations completed',
          output: output.split('\n').slice(-20), // Last 20 lines
        });
      } catch (error: any) {
        fastify.log.error('Migration error:', error.message);
        return reply.status(500).send({
          error: 'Migration failed',
          message: error.message,
          output: error.stdout?.split('\n').slice(-20) || [],
        });
      }
    } catch (error: any) {
      fastify.log.error(error);
      return reply.status(500).send({
        error: 'Internal server error',
      });
    }
  });

  // Health check for migrations
  fastify.get('/internal/migrate/status', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { PrismaClient } = require('@prisma/client');
      const prisma = new PrismaClient();
      
      // Try to query database to verify connection
      await prisma.$queryRaw`SELECT 1`;
      
      // Check if tables exist
      const tables = await prisma.$queryRaw<Array<{ tablename: string }>>`
        SELECT tablename FROM pg_tables WHERE schemaname = 'public'
      `;
      
      await prisma.$disconnect();
      
      return reply.send({
        connected: true,
        tables: tables.map((t: { tablename: string }) => t.tablename),
        tableCount: tables.length,
      });
    } catch (error: any) {
      return reply.status(500).send({
        connected: false,
        error: error.message,
      });
    }
  });
}

