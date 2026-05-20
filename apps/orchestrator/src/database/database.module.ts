import { Global, Module } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

export const PRISMA = 'PRISMA';

const prismaProvider = {
  provide: PRISMA,
  useFactory: async () => {
    const client = new PrismaClient({
      log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
    });
    await client.$connect();
    return client;
  },
};

@Global()
@Module({
  providers: [prismaProvider],
  exports: [PRISMA],
})
export class OrchestratorDatabaseModule {}
