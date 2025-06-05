import { PrismaClient } from '@prisma/client';
import { ValveTestType } from '@prisma/client';

// Extend the PrismaClient type to include the valveTestRecord model
declare global {
  namespace PrismaClient {
    interface PrismaClient {
      valveTestRecord: {
        findMany: (args?: any) => Promise<any[]>;
        findUnique: (args?: any) => Promise<any | null>;
        create: (args?: any) => Promise<any>;
        update: (args?: any) => Promise<any>;
        delete: (args?: any) => Promise<any>;
      };
    }
  }
}

// Export ValveTestType enum for use in the controller
export { ValveTestType };
