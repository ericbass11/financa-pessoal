# 💰 Finança Pessoal

App **PWA** (instalável no celular e no desktop) para controle de finanças pessoais, com banco de dados no **Supabase**. Feito com React + TypeScript + Vite + Tailwind CSS.

## ✨ Funcionalidades

- 📊 **Dashboard** — saldo total, receitas e despesas do mês, gráfico de gastos por categoria e evolução mensal.
- 💸 **Receitas e despesas** — registre transações com valor, data, categoria, conta e descrição.
- 🔄 **Transferências** entre contas.
- 🏦 **Contas / carteiras** — várias contas (banco, dinheiro, cartão, poupança, investimento) com saldo calculado automaticamente.
- 🏷️ **Categorias** — organize os lançamentos por categoria (já vem com um conjunto pronto).
- 🎯 **Orçamentos** — defina limites de gasto mensal por categoria e acompanhe o progresso.
- 🐷 **Metas de economia** — objetivos com valor-alvo e barra de progresso.
- 🔐 **Login seguro** por e-mail/senha (Supabase Auth) com isolamento total de dados por usuário (Row Level Security).
- 📱 **PWA** — instale como aplicativo e use offline (cache dos dados já carregados).
- 🌗 **Tema claro/escuro**.

---

## 🚀 Passo a passo — Configurar o Supabase

### 1. Crie a conta e o projeto

1. Acesse **https://supabase.com** e crie uma conta (pode entrar com o GitHub).
2. Clique em **New project**.
3. Escolha um nome (ex.: `financa-pessoal`), defina uma **senha do banco** (guarde-a) e a região mais próxima (ex.: *South America (São Paulo)*).
4. Aguarde ~2 minutos enquanto o projeto é provisionado.

### 2. Crie as tabelas (rode o schema SQL)

1. No painel do projeto, vá em **SQL Editor** (menu lateral) → **New query**.
2. Abra o arquivo [`supabase/schema.sql`](./supabase/schema.sql) deste repositório, **copie todo o conteúdo** e cole no editor.
3. Clique em **Run** (ou `Ctrl/Cmd + Enter`).
4. Deve aparecer *"Success. No rows returned"*. Pronto — tabelas, segurança (RLS) e o gatilho que cria categorias/carteira para cada novo usuário estão configurados.

### 3. Pegue as chaves de API

1. Vá em **Project Settings** (ícone de engrenagem) → **API**.
2. Copie:
   - **Project URL** → será o `VITE_SUPABASE_URL`
   - **Project API keys → `anon` `public`** → será o `VITE_SUPABASE_ANON_KEY`

> A chave `anon` é pública e pode ir no front-end com segurança — quem protege os dados é a política de RLS que o schema criou. **Nunca** use a chave `service_role` no app.

### 4. Configure a autenticação por e-mail

1. Vá em **Authentication** → **Providers** → **Email** e garanta que está **habilitado**.
2. Para testar rápido sem precisar confirmar e-mail: **Authentication → Sign In / Providers → Email** e **desative** "Confirm email" (opcional, recomendado só em desenvolvimento).
3. Em produção, mantenha a confirmação de e-mail ligada.

---

## 🧑‍💻 Rodar o projeto localmente

Pré-requisitos: **Node.js 18+**.

```bash
# 1. Instale as dependências
npm install

# 2. Crie o arquivo de variáveis de ambiente
cp .env.example .env
# edite o .env e cole a URL e a anon key do seu projeto Supabase

# 3. Rode em modo desenvolvimento
npm run dev
```

Abra **http://localhost:5173**, crie uma conta e comece a usar. 🎉

### Build de produção

```bash
npm run build     # gera a pasta dist/
npm run preview   # serve o build localmente para testar o PWA
```

---

## 📱 Instalar como app (PWA)

- **Android/Chrome:** abra o site → menu ⋮ → *"Adicionar à tela inicial" / "Instalar app"*.
- **iOS/Safari:** botão compartilhar → *"Adicionar à Tela de Início"*.
- **Desktop (Chrome/Edge):** ícone de instalar na barra de endereço.

> O PWA precisa de **HTTPS** em produção. Ao publicar em Vercel/Netlify/Cloudflare Pages, isso já vem pronto.

---

## ☁️ Publicar (deploy)

Qualquer host de site estático serve. Exemplo com **Vercel**:

1. Suba este repositório no GitHub.
2. Em https://vercel.com → **Add New Project** → importe o repositório.
3. Framework: **Vite** (detectado automaticamente). Build command `npm run build`, output `dist`.
4. Em **Environment Variables**, adicione `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY`.
5. **Deploy**. Depois adicione a URL de produção em **Supabase → Authentication → URL Configuration → Site URL / Redirect URLs**.

---

## 🗂️ Estrutura do projeto

```
financa-pessoal/
├─ public/                 # ícones do PWA, favicon
├─ scripts/gen-icons.mjs   # gerador dos ícones PNG
├─ supabase/schema.sql     # 👈 rode isto no Supabase
├─ src/
│  ├─ components/          # UI reutilizável (cards, layout, modais, gráficos)
│  ├─ context/             # AuthContext (sessão do usuário)
│  ├─ hooks/               # hooks de acesso a dados (useTransactions, etc.)
│  ├─ lib/                 # cliente Supabase, tipos, utilitários (formatação R$)
│  ├─ pages/               # telas (Login, Dashboard, Transações, Contas, ...)
│  ├─ App.tsx              # rotas
│  └─ main.tsx             # entrada
└─ vite.config.ts          # config Vite + PWA
```

## 🔒 Segurança

- Todos os dados são isolados por usuário via **Row Level Security** — um usuário nunca vê os dados de outro, mesmo compartilhando a mesma chave `anon`.
- As credenciais ficam em variáveis de ambiente e o arquivo `.env` está no `.gitignore`.

---

Feito com ☕ e React. Dúvidas ou melhorias? Abra uma issue.
