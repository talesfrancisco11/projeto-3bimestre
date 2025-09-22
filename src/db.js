// Conexão com o banco de dados usando Prisma
import { PrismaClient } from "@prisma/client";
import dotenv from "dotenv";

// Carregar variáveis de ambiente
dotenv.config();

// Criar uma única instância do Prisma (padrão Singleton)
const prisma = new PrismaClient();

// Conectar ao banco quando o módulo for carregado
prisma
  .$connect()
  .then(() => {
    console.log("✅ Conectado ao banco de dados MySQL via Prisma!");
  })
  .catch((error) => {
    console.error("❌ Erro ao conectar ao banco:", error.message);
    process.exit(1);
  });

// Graceful shutdown
process.on('beforeExit', async () => {
  await prisma.$disconnect();
  console.log("🔌 Desconectado do banco de dados.");
});

// Exportar a instância para usar nas rotas
export default prisma;
