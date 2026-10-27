# Login Service | API de Autenticação e Usuários

<p>
  <img src="https://img.shields.io/badge/NestJS-API-ea2845?logo=nestjs&logoColor=white" alt="NestJS" />
  <img src="https://img.shields.io/badge/TypeScript-Backend-3178c6?logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/PostgreSQL-Database-4169e1?logo=postgresql&logoColor=white" alt="PostgreSQL" />
  <img src="https://img.shields.io/badge/Prisma-ORM-2d3748?logo=prisma&logoColor=white" alt="Prisma" />
  <img src="https://img.shields.io/badge/Docker-Compose-2496ed?logo=docker&logoColor=white" alt="Docker Compose" />
  <img src="https://img.shields.io/badge/Jest-Tests-c21325?logo=jest&logoColor=white" alt="Jest" />
</p>

> API REST construída com NestJS para autenticação JWT, recuperação de senha por e-mail e gerenciamento de usuários. O projeto utiliza Prisma ORM, PostgreSQL e Docker Compose para apoiar o desenvolvimento local.

## Destaques da implementação

- **Autenticação JWT:** login com e-mail e senha, emissão de access token e proteção de rotas.
- **Recuperação de senha:** token temporário enviado por e-mail, com resposta genérica para não revelar se um endereço está cadastrado.
- **Gerenciamento de usuários:** criação, listagem paginada, atualização e remoção lógica.
- **Validação de documentos:** validação e normalização de CPF e RG durante o cadastro.
- **Documentação interativa:** Swagger disponível em `/docs` quando habilitado.
- **Ambiente local integrado:** PostgreSQL e Maildev podem ser executados com Docker Compose.

## Tecnologias

| Área | Tecnologias |
| --- | --- |
| API | NestJS, TypeScript, Node.js |
| Autenticação | Passport, JWT, bcrypt |
| Persistência | PostgreSQL, Prisma ORM |
| E-mail | Nodemailer, SMTP, Maildev para desenvolvimento |
| Qualidade | Jest, Supertest, ESLint |
| Ambiente | Docker, Docker Compose |

## Estrutura do projeto

```text
src/
  auth/       Controllers, serviços, DTOs, interfaces, guards e estratégias JWT
  user/       Controllers, serviços, DTOs, interfaces, paginação e validadores
  email/      Serviço de envio de e-mail via SMTP
  prisma/     Módulo e serviço de acesso ao banco
  common/     Filtros e tratamento de erros
prisma/       Schema e histórico de migrações
test/         Testes end-to-end
```

## Pré-requisitos

- Node.js 22 ou superior e npm para executar a aplicação localmente.
- Docker Desktop com Docker Compose v2 para subir PostgreSQL, Maildev e/ou a aplicação em contêineres.

## Configuração local

Crie o arquivo de ambiente a partir do exemplo:

```bash
cp .env.example .env
```

No PowerShell:

```powershell
Copy-Item .env.example .env
```

Configure no `.env` os valores usados no ambiente de desenvolvimento. Um exemplo de conexão ao PostgreSQL e ao Maildev do Compose:

```dotenv
DATABASE_URL="postgresql://postgres:postgres@localhost:5433/login_db?schema=public"
SMTP_HOST=localhost
SMTP_PORT=1025
SMTP_USER=
SMTP_PASS=
EMAIL_FROM=no-reply@example.com
JWT_SECRET=defina-um-segredo-local-forte
```

O Compose usa a porta `5433` no computador e `5432` entre contêineres. Ao rodar a API dentro do Compose, o host do SMTP deve ser `maildev`; para execução local, use `localhost`.

### Variáveis de ambiente

| Variável | Descrição | Exemplo local |
| --- | --- | --- |
| `APP_PORT` | Porta HTTP da API | `3000` |
| `HOST` | Interface de rede da aplicação | `0.0.0.0` |
| `DATABASE_URL` | URL de conexão do Prisma | PostgreSQL local na porta `5433` |
| `POSTGRES_USER` | Usuário do PostgreSQL no Compose | `postgres` |
| `POSTGRES_PASSWORD` | Senha do PostgreSQL no Compose | `postgres` somente para desenvolvimento |
| `POSTGRES_DB` | Banco criado pelo Compose | `login_db` |
| `JWT_SECRET` | Segredo de assinatura dos tokens | valor privado e forte |
| `JWT_EXPIRES_IN` | Validade do access token | `1h` |
| `SMTP_HOST`, `SMTP_PORT` | Host e porta SMTP | `localhost`, `1025` localmente |
| `SMTP_USER`, `SMTP_PASS` | Credenciais SMTP, se necessárias | vazias para Maildev local |
| `EMAIL_FROM` | Remetente das mensagens | `no-reply@example.com` |
| `BCRYPT_SALT_ROUNDS` | Custo do hash de senha | `10` |
| `RESET_TOKEN_EXPIRATION_MINUTES` | Validade do token de redefinição | `60` |
| `FRONTEND_URL` | Base usada para formar o link de redefinição | `http://localhost:3001` |
| `ENABLE_SWAGGER` | Habilita a interface Swagger | `true` |

Não versione o `.env` nem use os valores de exemplo em ambientes compartilhados ou de produção.

## Executar localmente

1. Instale as dependências e inicie o banco e o servidor de e-mail de desenvolvimento:

```bash
npm ci
docker compose up -d postgres maildev
```

2. Gere o cliente Prisma e aplique as migrações PostgreSQL no banco local:

```bash
npx prisma generate
npx prisma migrate dev
```

3. Inicie a API em modo de desenvolvimento:

```bash
npm run start:dev
```

Endereços locais:

- API: `http://localhost:3000`
- Swagger: `http://localhost:3000/docs`
- Maildev: `http://localhost:1080`

## Executar com Docker Compose

Depois de configurar o `.env`, execute:

```bash
docker compose up --build -d
docker compose exec login_service npx prisma migrate deploy
```

Para acompanhar os logs e encerrar os serviços:

```bash
docker compose logs -f login_service
docker compose down
```

O Compose publica a API na porta `3000`, o Maildev na `1080` e o PostgreSQL na `5433` do computador.

## Endpoints

As rotas protegidas exigem um JWT no cabeçalho `Authorization: Bearer <access_token>`. O cadastro é público para permitir criar a primeira conta; não há verificação de e-mail nem papéis administrativos neste momento.

| Método | Rota | Acesso | Descrição |
| --- | --- | --- | --- |
| `POST` | `/login` | Público | Autentica com e-mail e senha e retorna `access_token`. |
| `POST` | `/forgot-password` | Público | Solicita a recuperação de senha por e-mail. |
| `POST` | `/reset-password` | Público | Redefine a senha usando token e nova senha. |
| `GET` | `/me` | JWT | Retorna os dados básicos do usuário autenticado. |
| `POST` | `/users` | Público | Cria uma conta de usuário. |
| `GET` | `/users` | JWT | Lista usuários ativos; aceita `page` (base zero) e `pageSize` (1 a 100). |
| `GET` | `/users/:id` | JWT | Busca qualquer usuário ativo pelo ID. |
| `PATCH` | `/users/:id` | JWT | Atualiza o nome do usuário indicado pelo ID. |
| `DELETE` | `/users/:id` | JWT | Desativa outro usuário pelo ID e responde `204` sem corpo. Não permite desativar a própria conta. |
| `GET` | `/health` | Público | Retorna o estado de disponibilidade da API. |
| `GET` | `/check` | Público | Rota de verificação legada. |

### Exemplos

As respostas de sucesso usam o envelope `{ dominio: { metadados, data, message } }`. Apenas endpoints paginados incluem `pagination`; respostas simples não incluem essa propriedade. Por exemplo, a primeira página de usuários retorna:

```json
{
  "users": {
    "metadados": { "domains": ["users"], "api_version": "1.0" },
    "data": [
      {
        "id": "2bc7c2bd-9c2e-4b22-a02f-fc453a79048d",
        "document": "434993669",
        "email": "user@example.com",
        "name": "Usuário Exemplo",
        "active": true,
        "created_at": "2026-10-27T02:04:30.685Z",
        "deleted_at": null,
        "updated_at": null
      }
    ],
    "pagination": {
      "page": 0,
      "pageSize": 10,
      "totalPages": 1,
      "totalRecords": 1
    },
    "message": "Users retrieved successfully"
  }
}
```

Endpoints sem paginação omitem a propriedade `pagination`. `DELETE /users/:id` é a exceção: responde `204 No Content` e não retorna corpo.

Exemplo de listagem da primeira página (página zero):

```bash
curl "http://localhost:3000/users?page=0&pageSize=10" \
  -H "Authorization: Bearer <access_token>"
```

Quando a página solicitada não contém registros, `data` será `[]`; o serviço não redireciona para a última página.

Login (`POST /login`):

```bash
curl -X POST http://localhost:3000/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"AstrongPass1"}'
```

Resposta de login:

```json
{
  "login": {
    "metadados": { "domains": ["login"], "api_version": "1.0" },
    "data": { "access_token": "<access_token>" },
    "message": "Login successful"
  }
}
```

Solicitação de recuperação:

```bash
curl -X POST http://localhost:3000/forgot-password \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com"}'
```

A solicitação de recuperação sempre retorna uma mensagem genérica no envelope `login`. Durante o desenvolvimento, confira o link enviado na caixa de entrada do Maildev.

## Testes e build

Build de produção:

```bash
npm run build
```

Testes automatizados:

```bash
npm test
npm run test:e2e
```

**Validação atual:** os testes unitários são executados com `npm test`; `npm run test:cov` mede os controllers, services, estratégias, middleware, filtros e validadores selecionados em `test/jest-unit.json`. O ESLint permanece configurado apenas para reconhecer TypeScript, sem regras estilísticas efetivas.

## Banco de dados e migrações

O projeto utiliza exclusivamente PostgreSQL. O schema Prisma, o lockfile e o histórico versionado em `prisma/migrations` usam PostgreSQL.

Em um banco novo, aplique o histórico versionado:

```bash
npx prisma migrate dev
```

Em desenvolvimento, crie novas migrações com:

```bash
npx prisma migrate dev --name nome_da_migracao
```

Em ambientes publicados, aplique as migrações já versionadas com:

```bash
npx prisma migrate deploy
```

Gere o Prisma Client após alterar o schema:

```bash
npx prisma generate
```

O banco local deste projeto já está baselinado. Se conectar outro banco que já contém as tabelas, compare primeiro o schema existente com `prisma/schema.prisma`; se forem iguais, registre a migração inicial uma única vez:

```bash
npx prisma migrate resolve --applied 20261027000000_init_postgresql
```

Depois disso, `npx prisma migrate deploy` passa a aplicar normalmente as próximas migrações.

## Segurança e operação

- Use segredos fortes e exclusivos para `JWT_SECRET` fora do ambiente local.
- Troque as credenciais padrão do PostgreSQL antes de qualquer ambiente compartilhado.
- Configure um provedor SMTP e um banco de dados gerenciados para produção.
- `GET /users` exige autenticação e retorna apenas nome, status e data de criação, mas ainda lista todos os usuários ativos para qualquer usuário autenticado.
- O projeto ainda não possui papéis administrativos: qualquer usuário autenticado pode consultar, atualizar e desativar outras contas. A própria conta não pode ser desativada pela rota `DELETE`. Restrinja essas operações por papel/permissão antes de publicar a API em um ambiente compartilhado.
- Configure `ENABLE_SWAGGER=false` se a documentação não deve ficar exposta no ambiente publicado.