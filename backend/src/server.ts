import 'dotenv/config';
import app from './app';
import prisma from './lib/prisma';

const PORT = Number(process.env.PORT) || 4000;

async function main() {
  await prisma.$connect();
  console.log('Database connected');

  app.listen(PORT, () => {
    console.log(`TMIS API running on http://localhost:${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV ?? 'development'}`);
  });
}

main().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
