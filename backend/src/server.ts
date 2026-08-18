import { createApp } from './app';
import { env } from './config/env';
import { disconnectPrisma, prisma } from './config/prisma';

/**
 * Process entry point: verifies the database is reachable, starts the HTTP
 * server and wires up graceful shutdown.
 */
const start = async (): Promise<void> => {
  try {
    await prisma.$connect();
  } catch (error) {
    console.error('Could not connect to the SQLite database.');
    console.error('Run `npm run setup` from the project root to create and seed it.');
    console.error(error);
    process.exit(1);
  }

  const app = createApp();

  const server = app.listen(env.PORT, () => {
    console.log('');
    console.log('  Exam System (MCQ) API');
    console.log(`  Environment : ${env.NODE_ENV}`);
    console.log(`  Listening   : http://localhost:${env.PORT}`);
    console.log(`  Health      : http://localhost:${env.PORT}/api/health`);
    console.log(`  CORS origin : ${env.allowedOrigins.join(', ')}`);
    console.log('');
  });

  // A busy port is a routine local mishap, not a crash worth a stack trace.
  server.on('error', (error: NodeJS.ErrnoException) => {
    if (error.code === 'EADDRINUSE') {
      console.error(`\nPort ${env.PORT} is already in use.`);
      console.error('Another instance of the API is probably still running.');
      console.error(`Stop it, or set a different PORT in backend/.env.\n`);
      process.exit(1);
    }

    console.error('Server error:', error);
    process.exit(1);
  });

  const shutdown = (signal: string): void => {
    console.log(`\n${signal} received - shutting down gracefully.`);
    server.close(() => {
      void disconnectPrisma().finally(() => process.exit(0));
    });
  };

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));

  process.on('unhandledRejection', (reason) => {
    console.error('[unhandledRejection]', reason);
  });
};

void start();
