# Guia de Deploy na Vercel

Instruções para deploy do Despensa na Vercel com integração ao Supabase.

---

## 1. Importar Projeto na Vercel

1. Acesse [vercel.com](https://vercel.com) e clique em **Add New... > Project**.
2. Conecte sua conta GitHub e selecione o repositório `despensa-app`.
3. Framework Preset: **Next.js** (detectado automaticamente).
4. Root Directory: `./` (padrão).
5. Build Command: `npm run build` ou padrão Vercel (`next build`).
6. Output Directory: `.next` (padrão).

---

## 2. Variáveis de Ambiente na Vercel

No passo de configuração do projeto ou em **Project Settings > Environment Variables**, adicione:

| Chave | Valor | Ambientes |
| :--- | :--- | :--- |
| `NEXT_PUBLIC_SUPABASE_URL` | `https://seu-projeto.supabase.co` | Production, Preview, Development |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `sua-chave-anon-publica` | Production, Preview, Development |

---

## 3. Configurar Redirecionamento de Auth no Supabase

Para o login com Google e links mágicos funcionarem em produção:

1. No painel do [Supabase](https://supabase.com/dashboard), acesse:
   **Authentication > URL Configuration**.
2. **Site URL:**
   - Preencha com o domínio de produção da Vercel:
     `https://seu-projeto.vercel.app`
3. **Redirect URLs (Allow list):**
   - Adicione as URLs de callback:
     - `https://seu-projeto.vercel.app/**`
     - `https://*-seu-usuario.vercel.app/**` (para URLs de Preview do GitHub)
     - `http://localhost:3000/**` (para desenvolvimento local)

---

## 4. Banco de Dados e Migrations

As migrations versionadas estão localizadas na pasta `supabase/migrations/`:
1. `20241104000000_initial_schema.sql` (schema base, enums, tabelas e RLS)
2. `20241105000001_onboarding_and_catalog_fix.sql` (fluxo transacional de onboarding)
3. `20241105000002_fix_rls_and_session_queries.sql` (políticas RLS de sessões)
4. `20241105000003_fix_numeric_scale_and_units.sql` (precisão numérica e unidades)
5. `20241105000004_fix_household_members_rls_recursion.sql` (eliminação de recursão RLS)
6. `20241105000005_sync_shopping_session_totals_trigger.sql` (trigger em tempo real de totais do carrinho)

Caso esteja configurando um banco novo, execute todas as migrations sequencialmente no **SQL Editor** do Supabase.

---

## 5. PWA e Instalação Mobile

O projeto inclui PWA nativo configurado:
- Manifest em `public/manifest.webmanifest`.
- Ícones em `public/icons/`.
- Service worker em `public/sw.js`.
- Safe areas móveis (`viewport-fit=cover`) habilitadas para iOS e Android.
