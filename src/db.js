// Conexão com o banco de dados usando Prisma
import { PrismaClient } from "@prisma/client";

// Criar uma única instância do Prisma (padrão Singleton)
const prisma = new PrismaClient();

// Conectar ao banco quando o módulo for carregado
prisma
  .$connect()
  .then(() => {
    console.log("✅ Conectado ao banco de dados!");
  })
  .catch((error) => {
    console.error("❌ Erro ao conectar:", error.message);
  });

// Exportar a instância para usar nas rotas
export default prisma;
