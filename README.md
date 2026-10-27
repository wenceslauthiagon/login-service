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

2. Gere o cliente Prisma e sincronize o schema com o banco de desenvolvimento:

```bash
npx prisma generate
npx prisma db push
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
docker compose exec login_service npx prisma db push
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
| `GET` | `/users` | JWT | Lista usuários ativos sem e-mail ou documento; aceita `page` e `limitPerpage`. |
| `PATCH` | `/users/:id` | JWT do próprio usuário | Atualiza o nome da própria conta. |
| `DELETE` | `/users/:id` | JWT do próprio usuário | Desativa e marca a própria conta como removida. |
| `GET` | `/health` | Público | Retorna o estado de disponibilidade da API. |
| `GET` | `/check` | Público | Rota de verificação legada. |

### Exemplos

Login:

```bash
curl -X POST http://localhost:3000/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"AstrongPass1"}'
```

Solicitação de recuperação:

```bash
curl -X POST http://localhost:3000/forgot-password \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com"}'
```

A solicitação de recuperação sempre retorna uma mensagem genérica. Durante o desenvolvimento, confira o link enviado na caixa de entrada do Maildev.

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

**Estado conhecido da validação:** `npm run build` e `npm run lint` concluem com sucesso. O ESLint está configurado intencionalmente com validação sintática mínima de TypeScript, sem regras estilísticas. As duas suítes de teste ainda falham antes de executar os casos porque o Jest não transforma o pacote ESM `@nestjs/testing`.

## Banco de dados e migrações

O schema atual em `prisma/schema.prisma` declara PostgreSQL. **Há uma divergência no histórico existente:** `prisma/migrations` e `migration_lock.toml` foram criados para SQLite. Por isso, `prisma migrate dev` e `prisma migrate deploy` não são atualmente um fluxo de migração compatível com o banco configurado.

Para desenvolvimento, `prisma db push` sincroniza o schema sem depender desse histórico. Antes de publicar a aplicação, alinhe e gere migrações versionadas para PostgreSQL. `db push` não substitui um histórico de migrações para deploy.

## Segurança e operação

- Use segredos fortes e exclusivos para `JWT_SECRET` fora do ambiente local.
- Troque as credenciais padrão do PostgreSQL antes de qualquer ambiente compartilhado.
- Configure um provedor SMTP e um banco de dados gerenciados para produção.
- `GET /users` exige autenticação e retorna apenas nome, status e data de criação, mas ainda lista todos os usuários ativos para qualquer usuário autenticado.
- O projeto ainda não possui papéis administrativos; por isso, cada conta só pode alterar ou remover a si própria. Crie autorização por papéis antes de oferecer administração centralizada de usuários.
- Configure `ENABLE_SWAGGER=false` se a documentação não deve ficar exposta no ambiente publicado.