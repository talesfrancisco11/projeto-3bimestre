import { PrismaClient } from "@prisma/client";

export const prisma = new PrismaClient();

async function connectDB() {
  try {
    await prisma.$connect();
    console.log("✅ Conexão com o banco estabelecida com sucesso!");
  } catch (err) {
    console.error("❌ Erro ao conectar com o banco:", err);
    process.exit(1); // encerra a aplicação se não conectar
  }
}

connectDB();

export default prisma;
