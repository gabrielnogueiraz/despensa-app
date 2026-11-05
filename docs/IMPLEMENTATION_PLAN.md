# IMPLEMENTATION PLAN — Despensa

## 1. Roadmap e Estratégia de Entrega por Fases

Este plano detalha o roteiro de engenharia para construir o **Despensa** com rigor técnico, identidade visual autoral e sincronização em tempo real.

---

### Fase 1: Descoberta e Planejamento (Concluída)
- [x] Inspeção do repositório e identificação do estado inicial (vazio).
- [x] Elaboração do `PRD.md` com requisitos funcionais e não-funcionais.
- [x] Elaboração do `ARCHITECTURE.md` com padrões de Next.js 15, Realtime e PWA.
- [x] Elaboração do `DATABASE.md` com DDL PostgreSQL, RLS rigoroso e stored procedures.
- [x] Elaboração do `DESIGN_SYSTEM.md` com identidade "Cálido & Orgânico".
- [x] Elaboração do `IMPLEMENTATION_PLAN.md` com passos executáveis.

---

### Fase 2: Fundação Técnica & Design System
**Objetivo:** Estabelecer o projeto Next.js 15, instalar dependências exatas, configurar tokens visuais e conectar a camada Supabase (Auth + Client + Server + Middleware).

1. **Scaffolding e Dependências:**
   - Inicializar Next.js 15 com TypeScript, ESLint, Tailwind CSS e App Router.
   - Instalar `@supabase/supabase-js`, `@supabase/ssr`.
   - Instalar `lucide-react`, `motion`, `zod`, `react-hook-form`, `@hookform/resolvers`, `@tanstack/react-query`.
2. **Tokens e Estilos Base:**
   - Configurar `globals.css` com as variáveis de cor (Alabastro, Terracota, Sálvia, Âmbar).
   - Configurar utilitários de safe-area móvel (`pb-safe`, `pt-safe`).
   - Configurar fontes `Plus Jakarta Sans` via `next/font/google`.
3. **Componentes Primitivos Autorais:**
   - `Button`: Variantes Terracotta, Sage, Subtle, Ghost com feedback de scale do Motion.
   - `Input` & `NumericInput`: Alvos de toque generosos, sem aninhamento excessivo.
   - `Sheet` / `Drawer`: Bottom sheet móvel nativo com arrasto para fechar.
   - `Dialog` & `Badge`.
4. **Camada de Dados & Supabase:**
   - Implementar `src/lib/supabase/client.ts` (Browser).
   - Implementar `src/lib/supabase/server.ts` (Server Components & Server Actions).
   - Implementar `src/lib/supabase/middleware.ts` para renovação transparente de cookies de sessão.
   - Gerar script de migração versionada em `supabase/migrations/20241104000000_initial_schema.sql`.
5. **Estrutura PWA:**
   - Criar `public/manifest.webmanifest`.
   - Gerar ícones SVG/PNG representativos para tela inicial e splash screen.
   - Configurar meta tags móveis (`apple-mobile-web-app-capable`, `theme-color`).

---

### Fase 3: Experiência Principal (Core Modules)
**Objetivo:** Construir o fluxo completo compartilhado entre duas pessoas.

1. **Autenticação & Household Automático:**
   - Telas minimalistas de Login e Cadastro em `/(auth)/`.
   - Trigger ou Server Action que cria automaticamente o `household` do usuário no cadastro inicial.
   - Página de Gerenciamento do Lar com geração de Link de Convite (`/invite/[token]`).
   - Fluxo de entrada da esposa/segundo participante via link seguro com aceitação transacional.
2. **Módulo de Produtos & Lista Recorrente:**
   - Categorias com ícones e cores autorais.
   - CRUD de produtos da despensa (nome, unidade, categoria, preço médio).
   - Lista Recorrente: ativação/desativação de itens padrão para o mês.
3. **Módulo de Lista Mensal:**
   - Botão "Gerar Lista do Mês" chamando a procedure PostgreSQL `generate_monthly_list`.
   - Visualização agrupada por categorias de compras.
   - Adição e remoção pontual de itens sazonais sem alterar a matriz recorrente.
4. **Modo Supermercado (Live Shopping Engine):**
   - Rota otimizada `/(app)/shopping`.
   - **Sticky HUD:** Orçamentômetro flutuante com cálculo instantâneo do acumulado, saldo restante e barra de progresso orgânica.
   - **Lista de Corredor:** Divisão intuitiva entre itens pendentes e itens no carrinho.
   - **One-Thumb Check-In:** Toque no item abre a bottom sheet de teclado numérico para inserir preço real pago e quantidade.
   - **Supabase Realtime:** Inscrição em `postgres_changes` na tabela `cart_items` para atualização nos aparelhos de ambos em tempo real.
   - Persistência e tolerância a recargas acidentais de tela no supermercado.

---

### Fase 4: Finalização, Histórico & Polimento
**Objetivo:** Finalização de compra, preservação imutável no histórico, animações e testes de estresse.

1. **Conclusão de Compra & Histórico:**
   - Botão de checkout "Finalizar Compra" com confirmação contextual.
   - Execução da procedure `finish_shopping_session`, congelando total gasto e data.
   - Tela de Histórico (`/(app)/history`) com detalhes de cada compra anterior, comparativo com mês anterior e categorias que mais consumiram orçamento.
2. **Polimento Visual & Animações:**
   - Transições de página com Motion.
   - Animação do contador numérico do HUD estilo odômetro.
   - Micro-ilustrações SVG autorais para estados vazios (despensa vazia, sem compras no mês).
   - Teste de contraste WCAG AA e safe areas em iPhone e Android.

---

### Fase 5: Validação e Testes Ponta a Ponta
**Objetivo:** Bateria de testes de concorrência e isolamento multi-tenant.

- [ ] Teste 1: Cadastro de dois usuários independentes.
- [ ] Teste 2: Criação de Household pelo Usuário A.
- [ ] Teste 3: Usuário A gera link de convite e envia. Usuário B clica e ingressa no mesmo Household.
- [ ] Teste 4: Verificação de isolamento: Usuário C de outro Household não consegue ler itens dos usuários A e B.
- [ ] Teste 5: Criação da lista recorrente e geração da lista mensal de compras.
- [ ] Teste 6: Início da sessão de compras simultânea nos celulares de A e B.
- [ ] Teste 7: A adiciona item no carrinho com preço R$ 15,50; B visualiza o item marcado e o total recalculado sem dar refresh.
- [ ] Teste 8: Simulação de perda e recuperação de conexão (Offline / Online).
- [ ] Teste 9: Finalização da compra e verificação da integridade do histórico.
- [ ] Teste 10: Geração de nova lista mensal subsequente preservando itens da lista recorrente intactos.

---

## 2. Decisões que Dependem de Configuração Externa

Para o funcionamento do backend real, serão necessárias as variáveis no arquivo `.env.local`:
- `NEXT_PUBLIC_SUPABASE_URL`: URL do projeto Supabase.
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Chave anônima pública do Supabase.

> [!NOTE]
> Durante a execução inicial e testes de UI antes da vinculação com as credenciais do usuário, a aplicação fornecerá suporte a modo de demonstração local controlado e mock desacoplado, sem nunca misturar mocks com a arquitetura de produção do Supabase.