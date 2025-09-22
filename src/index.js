// Importar as bibliotecas necessárias
import express from "express";
import dotenv from "dotenv";
import prisma from "./db.js"; // Importar nossa conexão com o banco

// Carregar variáveis de ambiente do arquivo .env
dotenv.config();

// Criar aplicação Express
const app = express();

// Middleware para processar JSON nas requisições
app.use(express.json());

//Healthcheck
app.get("/", (_req, res) => res.json({ ok: true, service: "API 3º Bimestre" }));

//CREATE: POST /usuarios
app.post("/usuarios", async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const novoUsuario = await prisma.user.create({
      data: { name, email, password }
    });

    res.status(201).json(novoUsuario);
  } catch (error) {
    if (error.code === "P2002") {
      return res.status(409).json({ error: "E-mail já cadastrado" });
    }

    res.status(500).json({ error: "Erro ao criar usuário" });
  }
});

//READ: GET /usuarios
app.get("/usuarios", async (_req, res) => {
  try {
    const usuarios = await prisma.user.findMany({
      orderBy: { id: "asc" }
    });
    res.json(usuarios);
  } catch (error) {
    res.status(500).json({ error: "Erro ao listar usuários" });
  }
});

// CREATE: POST /stores - cria uma loja vinculada a um user
app.post("/stores", async (req, res) => {
  try {
    const { name, description, userId } = req.body;
    
    // Validação básica
    if (!name || !userId || isNaN(userId)) {
      return res.status(400).json({ error: "Nome e userId são obrigatórios, userId deve ser numérico" });
    }

    // Verificar se o usuário existe
    const user = await prisma.user.findUnique({
      where: { id: parseInt(userId) }
    });

    if (!user) {
      return res.status(404).json({ error: "Usuário não encontrado" });
    }

    // Verificar se o usuário já tem uma loja
    const existingStore = await prisma.store.findUnique({
      where: { userId: parseInt(userId) }
    });

    if (existingStore) {
      return res.status(409).json({ error: "Usuário já possui uma loja" });
    }

    const novaLoja = await prisma.store.create({
      data: { 
        name, 
        description,
        userId: parseInt(userId)
      },
      include: {
        user: true
      }
    });

    res.status(201).json(novaLoja);
  } catch (error) {
    console.error("Erro ao criar loja:", error);
    res.status(500).json({ error: "Erro interno do servidor" });
  }
});

// READ: GET /stores/:id - retorna a loja incluindo user e produtos
app.get("/stores/:id", async (req, res) => {
  try {
    const { id } = req.params;

    // Validação básica
    if (isNaN(id)) {
      return res.status(400).json({ error: "ID deve ser numérico" });
    }

    const loja = await prisma.store.findUnique({
      where: { id: parseInt(id) },
      include: {
        user: {
          select: { id: true, name: true, email: true, createdAt: true }
        },
        products: {
          orderBy: { createdAt: "desc" }
        }
      }
    });

    if (!loja) {
      return res.status(404).json({ error: "Loja não encontrada" });
    }

    res.json(loja);
  } catch (error) {
    console.error("Erro ao buscar loja:", error);
    res.status(500).json({ error: "Erro interno do servidor" });
  }
});

// CREATE: POST /products - cria um produto vinculado a uma loja
app.post("/products", async (req, res) => {
  try {
    const { name, description, price, stock, storeId } = req.body;
    
    // Validação básica
    if (!name || !price || !storeId || isNaN(price) || isNaN(storeId)) {
      return res.status(400).json({ 
        error: "Nome, preço e storeId são obrigatórios, preço e storeId devem ser numéricos" 
      });
    }

    if (parseFloat(price) < 0) {
      return res.status(400).json({ error: "Preço deve ser positivo" });
    }

    // Verificar se a loja existe
    const store = await prisma.store.findUnique({
      where: { id: parseInt(storeId) }
    });

    if (!store) {
      return res.status(404).json({ error: "Loja não encontrada" });
    }

    const novoProduto = await prisma.product.create({
      data: { 
        name, 
        description,
        price: parseFloat(price),
        stock: stock ? parseInt(stock) : 0,
        storeId: parseInt(storeId)
      },
      include: {
        store: {
          include: {
            user: {
              select: { id: true, name: true, email: true }
            }
          }
        }
      }
    });

    res.status(201).json(novoProduto);
  } catch (error) {
    console.error("Erro ao criar produto:", error);
    res.status(500).json({ error: "Erro interno do servidor" });
  }
});

// READ: GET /products - retorna todos produtos incluindo loja e dono da loja
app.get("/products", async (req, res) => {
  try {
    const produtos = await prisma.product.findMany({
      include: {
        store: {
          include: {
            user: {
              select: { id: true, name: true, email: true }
            }
          }
        }
      },
      orderBy: { createdAt: "desc" }
    });

    res.json(produtos);
  } catch (error) {
    console.error("Erro ao listar produtos:", error);
    res.status(500).json({ error: "Erro interno do servidor" });
  }
});

// UPDATE: PUT /stores/:id - atualiza o nome da loja
app.put("/stores/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description } = req.body;

    // Validação básica
    if (isNaN(id)) {
      return res.status(400).json({ error: "ID deve ser numérico" });
    }

    if (!name) {
      return res.status(400).json({ error: "Nome é obrigatório" });
    }

    // Verificar se a loja existe
    const lojaExistente = await prisma.store.findUnique({
      where: { id: parseInt(id) }
    });

    if (!lojaExistente) {
      return res.status(404).json({ error: "Loja não encontrada" });
    }

    const lojaAtualizada = await prisma.store.update({
      where: { id: parseInt(id) },
      data: { 
        name,
        description: description !== undefined ? description : lojaExistente.description
      },
      include: {
        user: {
          select: { id: true, name: true, email: true }
        },
        products: true
      }
    });

    res.json(lojaAtualizada);
  } catch (error) {
    console.error("Erro ao atualizar loja:", error);
    res.status(500).json({ error: "Erro interno do servidor" });
  }
});

// DELETE: DELETE /stores/:id - remove a loja
app.delete("/stores/:id", async (req, res) => {
  try {
    const { id } = req.params;

    // Validação básica
    if (isNaN(id)) {
      return res.status(400).json({ error: "ID deve ser numérico" });
    }

    // Verificar se a loja existe
    const lojaExistente = await prisma.store.findUnique({
      where: { id: parseInt(id) },
      include: {
        products: true
      }
    });

    if (!lojaExistente) {
      return res.status(404).json({ error: "Loja não encontrada" });
    }

    // Verificar se a loja tem produtos
    if (lojaExistente.products.length > 0) {
      return res.status(409).json({ 
        error: "Não é possível excluir loja com produtos cadastrados" 
      });
    }

    await prisma.store.delete({
      where: { id: parseInt(id) }
    });

    res.json({ message: "Loja removida com sucesso" });
  } catch (error) {
    console.error("Erro ao remover loja:", error);
    res.status(500).json({ error: "Erro interno do servidor" });
  }
});

// UPDATE: PUT /products/:id - atualiza nome e preço do produto
app.put("/products/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, price, stock } = req.body;

    // Validação básica
    if (isNaN(id)) {
      return res.status(400).json({ error: "ID deve ser numérico" });
    }

    if (price !== undefined && (isNaN(price) || parseFloat(price) < 0)) {
      return res.status(400).json({ error: "Preço deve ser um número positivo" });
    }

    if (stock !== undefined && (isNaN(stock) || parseInt(stock) < 0)) {
      return res.status(400).json({ error: "Estoque deve ser um número positivo" });
    }

    // Verificar se o produto existe
    const produtoExistente = await prisma.product.findUnique({
      where: { id: parseInt(id) }
    });

    if (!produtoExistente) {
      return res.status(404).json({ error: "Produto não encontrado" });
    }

    // Preparar dados para atualização (manter valores existentes se não fornecidos)
    const dadosAtualizacao = {};
    if (name !== undefined) dadosAtualizacao.name = name;
    if (description !== undefined) dadosAtualizacao.description = description;
    if (price !== undefined) dadosAtualizacao.price = parseFloat(price);
    if (stock !== undefined) dadosAtualizacao.stock = parseInt(stock);

    if (Object.keys(dadosAtualizacao).length === 0) {
      return res.status(400).json({ error: "Nenhum campo para atualizar foi fornecido" });
    }

    const produtoAtualizado = await prisma.product.update({
      where: { id: parseInt(id) },
      data: dadosAtualizacao,
      include: {
        store: {
          include: {
            user: {
              select: { id: true, name: true, email: true }
            }
          }
        }
      }
    });

    res.json(produtoAtualizado);
  } catch (error) {
    console.error("Erro ao atualizar produto:", error);
    res.status(500).json({ error: "Erro interno do servidor" });
  }
});

// DELETE: DELETE /products/:id - remove o produto
app.delete("/products/:id", async (req, res) => {
  try {
    const { id } = req.params;

    // Validação básica
    if (isNaN(id)) {
      return res.status(400).json({ error: "ID deve ser numérico" });
    }

    // Verificar se o produto existe
    const produtoExistente = await prisma.product.findUnique({
      where: { id: parseInt(id) }
    });

    if (!produtoExistente) {
      return res.status(404).json({ error: "Produto não encontrado" });
    }

    await prisma.product.delete({
      where: { id: parseInt(id) }
    });

    res.json({ message: "Produto removido com sucesso" });
  } catch (error) {
    console.error("Erro ao remover produto:", error);
    res.status(500).json({ error: "Erro interno do servidor" });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});

//ROTA DE TESTE
app.get("/status", (req, res) => {
  res.json({ message: "API Online" });
});
