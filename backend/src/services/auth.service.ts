import { PrismaClient, User, Role } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

export async function findUserByUsername(username: string): Promise<User | null> {
  return prisma.user.findUnique({ where: { username } });
}

export async function createUser(username: string, passwordRAW: string, role: Role): Promise<User> {
  const passwordHash = await bcrypt.hash(passwordRAW, 10);
  return prisma.user.create({
    data: { username, passwordHash, role },
  });
}

export async function findUserById(id: number): Promise<Pick<User, 'id' | 'username' | 'role' | 'createdAt' | 'updatedAt'> | null> {
    return prisma.user.findUnique({
        where: { id },
        select: { id: true, username: true, role: true, createdAt: true, updatedAt: true }
    });
}
