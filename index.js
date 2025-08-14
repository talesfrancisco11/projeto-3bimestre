import express from "express";

const app = express();
const PORT = 3000;

app.use(express.json());

let usuarios = [];
let contador = 1;

//ROTA DE TESTE
app.get("/status", (req, res) => {
  res.json({ message: "API Online" });
});

//ROTA GET BUSCA USUARIOS
app.get("/usuarios", (req, res) => {
  res.json(usuarios);
});

//ROTA POST ENVIA USUARIOS
app.post("/usuarios", (req, res) => {
  const { nome } = req.body;

  const novoUsuario = {
    id: contador++,
    nome
  };

  usuarios.push(novoUsuario);
  res.status(201).json(novoUsuario);
});

//ROTA PUT ATUALIZAR USUARIO POR ID
app.put("/usuarios/:id", (req, res) => {
  const id = parseInt(req.params.id);
  const { nome } = req.body;

  const usuario = usuarios.find((i) => i.id === id);

  if (!usuario) {
    return res.status(404).json({ erro: "Usuario não encontrado" });
  }

  usuario.nome = nome;
  res.json(usuario);
});

app.delete("/usuarios/:id", (req, res) => {
  const id = parseInt(req.params.id);
  const index = usuarios.findIndex((i) => i.id === id);

  if (index === -1) {
    return res.status(404).json({ erro: "Item não encontrado" });
  }

  usuarios.splice(index, 1);
  res.status(204).send();
});

app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});
