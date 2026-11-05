# PRD — Despensa: Aplicativo Inteligente de Compras Domésticas

## 1. Visão Executiva e Problema

O **Despensa** é um Progressive Web App (PWA) mobile-first voltado para casais organizarem, abastecerem e acompanharem o orçamento doméstico em tempo real, eliminando atritos antes, durante e após as idas ao supermercado.

### 1.1. Dores Críticas Resolvidas
1. **Esquecimento da lista:** Criação mensal cansativa do zero; itens essenciais são esquecidos.
2. **Estresse no supermercado:** Necessidade de alternar entre bloco de notas, calculadora e carrinho físico.
3. **Surpresa no caixa:** Ausência de controle acumulado do valor dos itens colocados no carrinho versus o orçamento estipulado para o mês.
4. **Desconexão a dois:** Falta de sincronização quando ambos estão no supermercado ou quando um adiciona um item de última hora de casa.

---

## 2. Personas e Cenários de Uso

### 2.1. Personas
- **Usuário A (Organizador do Lar):** Mantém a rotina da casa, define a lista base recorrente, estipula o teto de gastos do mês e acompanha os gastos históricos.
- **Usuário B (Parceiro de Compras):** Executa compras no supermercado, divide corredores, atualiza preços unitários, insere itens de impulso e valida o total no caixa.

### 2.2. Jornadas Principais
1. **Setup Inicial & Conexão:** Usuário A cria a conta, o sistema gera o Household automaticamente. Usuário A gera um link de convite único e envia via WhatsApp. Usuário B clica, cadastra-se e passa a compartilhar o mesmo espaço.
2. **Ciclo Recorrente:** Durante o mês, ambos alimentam a lista base de produtos por categoria com unidades e preços médios estimados.
3. **Geração da Lista Mensal:** No início do mês, um clique gera a lista do mês clonando os itens ativos da lista recorrente sem afetar a matriz base.
4. **Modo Supermercado (Ao Vivo):** Ambos entram no supermercado. Itens são riscados e movidos para a gaveta "No Carrinho". Preços e quantidades reais são preenchidos com teclado numérico otimizado para uma mão. O total acumulado atualiza em milissegundos para ambos os aparelhos.
5. **Checkout & Histórico:** Conferência rápida do total com a nota fiscal. Fechamento da sessão com consolidação do gasto real no histórico imutável.

---

## 3. Requisitos Funcionais (RF)

### Módulo A: Identidade, Household & Convites
- **RF-01:** Autenticação por e-mail/senha via Supabase Auth com persistência de sessão.
- **RF-02:** Criação automática de um `Household` no primeiro acesso do usuário (papel: `admin`).
- **RF-03:** Geração de convite com token criptográfico único, URL segura e validade configurável (ex: 7 dias).
- **RF-04:** Fluxo de aceitação de convite: validação de token, vinculação como `member`, revogação após uso e redirecionamento ao espaço compartilhado.
- **RF-05:** Gerenciamento de participantes: visualização dos membros do lar, revogação de convites pendentes e controle de saída.

### Módulo B: Cadastro de Produtos & Lista Recorrente
- **RF-06:** Categorias padrão organizadas (Hortifruti, Mercearia, Carnes, Laticínios, Bebidas, Limpeza, Higiene, Congelados, Padaria, Outros) com ícones e cores autorais.
- **RF-07:** Cadastro e edição de produtos com nome, categoria, unidade de medida (`un`, `kg`, `g`, `l`, `ml`, `pct`, `cx`), preço de referência e status ativo/inativo.
- **RF-08:** Lista Recorrente como repositório mestre permanente: reordenação por categoria, ajuste de quantidades padrão e ativação/desativação sem exclusão do histórico.

### Módulo C: Lista Mensal
- **RF-09:** Geração de lista mensal a partir dos itens ativos da lista recorrente para o mês/ano selecionado, prevenindo duplicação sem aviso.
- **RF-10:** Edição livre e isolada da lista mensal: adição de itens extras sazonais, remoção de itens pontuais e ajuste de quantidades sem impactar a matriz recorrente.
- **RF-11:** Métricas de planejamento: previsão total estimada com base nos preços de referência.

### Módulo D: Modo Supermercado (Live Shopping Engine)
- **RF-12:** Visualização em modo foco com tipografia ampliada, botões táteis para uma só mão e divisão clara entre "Pendentes" e "No Carrinho".
- **RF-13:** Interação de check-in: ao tocar/arrastar um item para o carrinho, abre-se uma mini-folha (bottom sheet) numérica para preenchimento de preço real unitário, quantidade comprada e desconto opcional.
- **RF-14:** Contador vivo e fixo (Sticky HUD):
  - Total gasto acumulado (R$).
  - Orçamento estipulado vs. Valor restante.
  - Indicador de porcentagem do orçamento (barra orgânica com tons suaves até 85%, âmbar entre 85-100%, ocre acolhedor > 100%).
  - Quantidade de itens comprados vs. pendentes.
- **RF-15:** Sincronização concorrente via Supabase Realtime: alteração de item ou preço por um cônjuge reflete instantaneamente na tela do outro sem perda de foco.
- **RF-16:** Adição rápida de itens surpresa durante a compra sem precisar voltar a telas anteriores.
- **RF-17:** Conclusão da compra: validação final, fechamento da sessão e gravação de cópia imutável dos itens comprados no histórico.

### Módulo E: Histórico & Métricas
- **RF-18:** Histórico cronológico de compras passadas com resumo visual (data, total gasto, total de itens, desvio frente ao orçamento).
- **RF-19:** Detalhamento da compra com lista completa de preços unitários registrados, categorias mais pesadas no orçamento e comparação com o mês anterior.

---

## 4. Requisitos Não-Funcionais (RNF)

- **RNF-01 (Performance & Latência):** Propagação de eventos Realtime < 300ms entre clientes ativos.
- **RNF-02 (Mobile-First Ergonomics):** Todas as ações críticas de compras alcançáveis pelo polegar (Thumb Zone inferior em telas de 5.8" a 6.7").
- **RNF-03 (PWA & Conexão Instável):** Service Worker com cache do App Shell e assets; tolerância a perda temporária de sinal de internet com sincronização em fila e zero travamento de tela.
- **RNF-04 (Segurança & RLS):** 100% das tabelas protegidas por Row Level Security no PostgreSQL, restringindo leitura e escrita estritamente aos membros validados do mesmo `household_id`.
- **RNF-05 (Acessibilidade & Feedback):** Conformidade com WCAG AA, contraste mínimo de 4.5:1, rótulos ARIA para leitores de tela e suporte nativo a `prefers-reduced-motion`.
- **RNF-06 (Formatos Locais):** Datas formatadas em `pt-BR` e moedas em `BRL` com formatação tabular (`Intl.NumberFormat`).

---

## 5. Fora de Escopo da V1
- Leitura de código de barras por câmera.
- Integração bancária (Open Finance) ou OCR de nota fiscal (NFC-e).
- Algoritmos preditivos de IA de consumo de estoque.
- Listas públicas ou compartilhamento com mais de 2 pessoas no mesmo plano gratuito.