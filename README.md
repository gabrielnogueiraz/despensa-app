# 🌿 Despensa — Compras Domésticas a Dois

Aplicativo inteligente de compras domésticas e modo supermercado ao vivo para casais, construído com foco em **experiência mobile premium**, simplicidade, acompanhamento de gastos em tempo real e compartilhamento de despensa sem atritos.

---

## 📱 Destaques do Produto

- **Linguagem Visual "Cálido & Orgânico":** Inspirado no refinamento e simplicidade dos apps da Apple, com tons de linho/alabastro (`#FAF8F5`), acentos quentes de terracota (`#D9532F`) e verde sálvia (`#26593F`). Zero visual de dashboard genérico.
- **Despensa Recorrente:** Lista-base perpétua dos produtos essenciais do lar organizada por categorias (Hortifruti, Mercearia, Carnes, Padaria, Limpeza, etc.).
- **Geração de Lista Mensal:** Com um toque, clona os itens ativos da despensa para o mês vigente sem desconfigurar a matriz base.
- **Modo Supermercado com Sticky HUD:**
  - Contador flutuante com cálculo automático do valor acumulado no carrinho (`tabular-nums`).
  - Orçamentômetro visual com progresso suave e alerta acolhedor de teto de gastos.
  - Teclado numérico inferior ergonômico para registrar o preço de prateleira e quantidade com apenas uma mão enquanto empurra o carrinho.
- **Sincronização a Dois (Supabase Realtime):** Ambos podem estar no supermercado em corredores diferentes ou um em casa e outro no mercado; itens marcados e preços atualizam em milissegundos.
- **Preservação de Histórico:** Ao finalizar a compra, os totais reais e a lista de produtos comprados são congelados imutavelmente.
- **PWA Instalável:** Manifesto, ícones autorais e Service Worker configurados para instalação direta na tela de início do iOS e Android.

---

## 🛠️ Stack Tecnológica

- **Framework:** Next.js 16 (App Router) + React 19
- **Linguagem:** TypeScript com tipagem estrita
- **Estilização:** Tailwind CSS v4 com tokens semânticos e safe areas móveis (`pb-safe`, `pt-safe`)
- **Animações:** Motion (`motion/react`) com suporte a `prefers-reduced-motion`
- **Ícones:** Lucide React + SVGs autorais
- **Banco e Auth:** Supabase (PostgreSQL 15+, Supabase Auth, Row Level Security e Realtime Logical Replication)
- **Cache & Mutations:** TanStack Query v5

---

## 🚀 Como Executar Localmente

### 1. Instalar dependências
```bash
npm install
```

### 2. Iniciar servidor de desenvolvimento
```bash
npm run dev
```
Acesse [http://localhost:3000](http://localhost:3000) no navegador ou pelo celular na mesma rede Wi-Fi.

> [!NOTE]
> O aplicativo funciona imediatamente em **Modo Demonstração** mesmo sem credenciais do Supabase configuradas, utilizando persistência local (`localStorage`) e um simulador de alternância entre os dois cônjuges ("👨‍🍳 Eu" e "👩‍🌾 Esposa") para testes rápidos.

---

## 🔑 Configuração do Supabase (Produção / Nuvem)

Para ativar a autenticação real, banco de dados PostgreSQL na nuvem e sincronização multi-dispositivo em tempo real:

1. Crie um projeto gratuito no [Supabase](https://supabase.com).
2. Acesse o **SQL Editor** no painel do Supabase e execute a migration versionada localizada em:
   ```
   supabase/migrations/20241104000000_initial_schema.sql
   ```
3. Crie um arquivo `.env.local` na raiz do projeto com as seguintes variáveis:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=sua-chave-anon-publica
   ```
4. Reinicie o servidor (`npm run dev`). O aplicativo conectará automaticamente ao Supabase com todas as políticas RLS ativas!

---

## 📚 Documentação Técnica de Arquitetura

Os detalhes completos de concepção, modelagem e deploy estão disponíveis na pasta `docs/`:
- [DEPLOY_VERCEL.md](docs/DEPLOY_VERCEL.md): Guia de deploy na Vercel e configuração de Auth/Supabase.
- [PRD.md](docs/PRD.md): Requisitos funcionais e regras de negócio.
- [ARCHITECTURE.md](docs/ARCHITECTURE.md): Arquitetura modular, concorrência e estratégias de tolerância a falhas.
- [DATABASE.md](docs/DATABASE.md): Modelagem relacional com DDL, triggers e políticas RLS.
- [DATA_FLOW_AUDIT.md](docs/DATA_FLOW_AUDIT.md): Auditoria e integridade do fluxo de dados ponta a ponta.
- [DESIGN_SYSTEM.md](docs/DESIGN_SYSTEM.md): Filosofia de design, tokens de cores, tipografia e ergonomia móvel.
- [IMPLEMENTATION_PLAN.md](docs/IMPLEMENTATION_PLAN.md): Roteiro de desenvolvimento e critérios de aceite.
