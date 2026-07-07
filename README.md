# 📋 Kanbam

Kanban interativo com autenticação JWT, drag-and-drop de tarefas e assistente de IA integrado.

**Stack:** NestJS + Prisma + PostgreSQL no backend · Vue 3 + Vite + PrimeVue no frontend.

---

## 🚀 Guia rápido — do zero ao app rodando

### 📦 Pré-requisitos

| Ferramenta | Versão mínima |
|------------|---------------|
| 🟢 Node.js | `20.19+` ou `22.12+` |
| 🐳 Docker   | Desktop ou Engine instalado |
| 📟 npm      | Vem com o Node |

---

### 1️⃣ Subir o banco com Docker

Na **raiz do projeto**, inicie o PostgreSQL:

```bash
docker compose up -d
```

✅ O container `kanban_postgres` sobe na porta **5432** com:

- **Usuário:** `postgres`
- **Senha:** `postgres`
- **Banco:** `kanban_db`

🔍 Conferir se está rodando:

```bash
docker compose ps
```

---

### 2️⃣ Configurar o backend

```bash
cd backend
npm install
```

Copie o arquivo de ambiente e preencha os valores:

```bash
cp .env.example .env
```

Exemplo de `.env` para desenvolvimento local:

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/kanban_db"
CORS_ORIGINS="http://localhost:5173"
JWT_ACCESS_SECRET="sua-chave-secreta-aqui"
JWT_ACCESS_EXPIRATION_SECONDS=259200
GEMINI_API_KEY="sua-chave-gemini-aqui"
```

> 🔑 `JWT_ACCESS_SECRET` — qualquer string longa e aleatória serve em dev.  
> 🤖 `GEMINI_API_KEY` — necessária para o chat de IA. Obtenha em [Google AI Studio](https://aistudio.google.com/apikey).

Aplique as migrations do Prisma:

```bash
npx prisma migrate dev
```

Inicie o backend em modo desenvolvimento:

```bash
npm run start:dev
```

✅ Backend disponível em **http://localhost:3000**  
📚 Swagger (docs da API): **http://localhost:3000/api/docs**

---

### 3️⃣ Configurar o frontend

Abra um **novo terminal** e vá para a pasta do frontend:

```bash
cd frontend
npm install
```

Opcional — crie um `.env` se quiser apontar para outra URL de API:

```env
VITE_API_URL=http://localhost:3000
```

> 💡 Sem o `.env`, o frontend já usa `http://localhost:3000` por padrão.

Inicie o frontend:

```bash
npm run dev
```

✅ Frontend disponível em **http://localhost:5173**

---

### 4️⃣ Rodar backend + frontend ao mesmo tempo

Você precisa de **dois terminais abertos**:

| Terminal | Pasta      | Comando              | URL                        |
|----------|------------|----------------------|----------------------------|
| 🖥️ **1** | `backend/` | `npm run start:dev`  | http://localhost:3000      |
| 🖥️ **2** | `frontend/`| `npm run dev`        | http://localhost:5173      |

E o Docker deve estar ativo desde o passo 1:

```bash
# na raiz do projeto
docker compose up -d
```

**Ordem recomendada:**

```
🐳 Docker  →  ⚙️ Backend  →  🎨 Frontend  →  🌐 Abrir http://localhost:5173
```

---

### 5️⃣ Primeiro acesso

1. 🌐 Acesse **http://localhost:5173**
2. 📝 Crie uma conta em **Registrar**
3. 🔐 Faça login
4. 📋 Use o quadro Kanban — arraste tarefas entre colunas
5. 🤖 Teste o assistente de IA no chat integrado

---

## 🗂️ Estrutura do projeto

```
kanbam/
├── 🐳 docker-compose.yml   # PostgreSQL
├── ⚙️ backend/             # API NestJS + Prisma
└── 🎨 frontend/            # App Vue 3 + Vite
```

---

## 🛠️ Comandos úteis

| Ação | Comando |
|------|---------|
| ⏹️ Parar o banco | `docker compose down` |
| 🔄 Resetar banco (apaga dados) | `docker compose down -v` |
| 🏗️ Build do backend | `cd backend && npm run build` |
| 🏗️ Build do frontend | `cd frontend && npm run build` |
| 🔍 Prisma Studio (visualizar DB) | `cd backend && npx prisma studio` |
