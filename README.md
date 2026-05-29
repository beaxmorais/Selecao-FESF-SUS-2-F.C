# Sistema de Triagem Hematológica — Item 02 (Docker + OAuth2)

Reimplementação do projeto [Selecao-FESF-SUS](https://github.com/beaxmorais/Selecao-FESF-SUS), com foco na comprovação do **Item 02 – BAREMA**: conteinerização funcional via Docker, com `Dockerfile`, `docker-compose.yml` e autenticação **OAuth2/JWT**.

**Stack:** FastAPI + SQLAlchemy + PostgreSQL (backend) | Next.js + Zustand + Tailwind (frontend) | Docker Compose

## Requisitos atendidos (Item 02)

- [x] `Dockerfile` para backend (Python/FastAPI) e frontend (Next.js)
- [x] `docker-compose.yml` orquestrando PostgreSQL, backend e frontend
- [x] OAuth2 com `OAuth2PasswordBearer` e fluxo de login em `/api/v1/auth/login`
- [x] JWT emitido com `python-jose` e validado em rotas protegidas
- [x] Interface com login, área autenticada e logout
- [x] Instruções completas de execução e credenciais demo

## Arquitetura

```
┌─────────────────┐     OAuth2/JWT    ┌─────────────────┐
│   Next.js       │ ◄──────────────► │   FastAPI       │
│   (Zustand)     │                   │   (SQLAlchemy)  │
└─────────────────┘                   └────────┬────────┘
                                               │
                                               ▼
                                      ┌─────────────────┐
                                      │   PostgreSQL    │
                                      └─────────────────┘
```

## Arquivos principais

| Arquivo | Função |
|---------|--------|
| `backend/Dockerfile` | Imagem da API FastAPI |
| `frontend/Dockerfile` | Imagem do frontend Next.js |
| `docker-compose.yml` | Orquestração dos serviços |
| `backend/app/api/v1/routes/auth.py` | Login OAuth2 e endpoint `/me` |
| `backend/app/api/v1/deps.py` | `OAuth2PasswordBearer` e validação de token |
| `backend/app/core/security.py` | Geração e decodificação de JWT |
| `frontend/stores/authStore.ts` | Gestão de sessão com Zustand |
| `frontend/app/login/page.tsx` | Tela de login |

## Como executar com Docker

### Pré-requisitos

- Docker e Docker Compose

### Passos

1. Clone o repositório e entre na pasta do projeto.

2. Copie as variáveis de ambiente:
   ```bash
   cp .env.example .env
   ```

3. Suba os serviços:
   ```bash
   docker compose up --build -d
   ```

4. Execute as migrations:
   ```bash
   docker compose exec backend alembic upgrade head
   ```

5. Popule dados de demonstração:
   ```bash
   docker compose exec backend python -m app.seed
   ```

6. Acesse:
   - **Frontend:** http://localhost:3000
   - **API / Swagger:** http://localhost:8000/docs

### Credenciais de demonstração

| Perfil      | E-mail                    | Senha      |
|-------------|---------------------------|------------|
| Admin       | admin@example.com          | admin123   |
| Solicitante | solicitante@example.com    | solicit123 |
| Regulador   | regulador@example.com      | regul123   |

## Como testar OAuth2

### Via Swagger (`/docs`)

1. Abra http://localhost:8000/docs
2. Clique em **Authorize**
3. Informe e-mail e senha (campo `username` recebe o e-mail)
4. Após autorizar, chame `GET /api/v1/auth/me` — deve retornar o usuário autenticado
5. Tente chamar uma rota protegida sem token — deve retornar `401 Unauthorized`

### Via frontend

1. Acesse http://localhost:3000
2. Faça login com `solicitante@example.com` / `solicit123`
3. Navegue pelo dashboard, pacientes e encaminhamentos (rotas protegidas)
4. Clique em **Sair** para encerrar a sessão

### Via curl

```bash
# Obter token
curl -X POST http://localhost:8000/api/v1/auth/login \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=solicitante@example.com&password=solicit123"

# Usar token (substitua TOKEN pelo access_token retornado)
curl http://localhost:8000/api/v1/auth/me \
  -H "Authorization: Bearer TOKEN"
```

## Checklist de validação

- [ ] `docker compose up --build` sobe os três serviços sem erro
- [ ] Login no frontend redireciona para área autenticada
- [ ] Swagger autoriza com OAuth2 e retorna `/auth/me`
- [ ] Rotas protegidas retornam 401 sem token
- [ ] Logout limpa a sessão no frontend
