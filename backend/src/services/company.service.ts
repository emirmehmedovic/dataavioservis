import { PrismaClient, Company } from '@prisma/client';

const prisma = new PrismaClient();

export async function findAllCompanies(): Promise<Company[]> {
  return prisma.company.findMany({
    include: { vehicles: true }, // Consider if vehicles are always needed
  });
}

export async function findCompanyById(id: number): Promise<Company | null> {
  return prisma.company.findUnique({
    where: { id },
    include: { vehicles: true }, // Consider if vehicles are always needed
  });
}

export async function findCompanyByName(name: string): Promise<Company | null> {
    return prisma.company.findUnique({
        where: { name },
    });
}

export async function createNewCompany(name: string): Promise<Company> {
  return prisma.company.create({ data: { name } });
}

interface UpdateCompanyData {
  name?: string;
}

export async function updateCompanyById(id: number, data: UpdateCompanyData): Promise<Company> {
  // Prisma throws P2025 if record to update is not found, which will be caught by controller
  // Prisma throws P2002 if name is a unique constraint and it's violated.
  return prisma.company.update({
    where: { id },
    data,
  });
}

export async function deleteCompanyById(id: number): Promise<Company> {
  // Prisma throws P2025 if record to delete is not found, which will be caught by controller
  return prisma.company.delete({ where: { id } });
}
