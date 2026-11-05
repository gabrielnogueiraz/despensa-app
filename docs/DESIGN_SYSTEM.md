# DESIGN SYSTEM — Despensa: Linguagem Visual "Cálido & Orgânico"

## 1. Filosofia de Design e Identidade de Produto

O **Despensa** rejeita o visual de "painel SaaS/Dashboard genérico de IA" com gradientes roxos, bordas em excesso e cards aninhados. 

Nossa direção visual é inspirada na elegância e foco dos aplicativos da **Apple**, combinada com o calor de uma **casa viva e acolhedora**:
- **Simplicidade e Respiro:** Superfícies amplas, alinhamento visual seguro, espaçamento generoso que guia os olhos sem poluição visual.
- **Calor Doméstico:** Tons de linho, pedra quente, alabastro e cerâmica artesanal, em vez de cinzas frios industriais (`#F3F4F6`).
- **Precisão Cirúrgica no Supermercado:** No modo compras, a interface ganha peso funcional: botões com alvos de toque generosos (mínimo 48x48px), números grandes em `tabular-nums` e feedback instantâneo ao toque do polegar.

---

## 2. Paleta de Cores e Tokens Semânticos

```css
:root {
  /* Canvas e Fundos Acolhedores */
  --color-canvas: #FAF8F5;          /* Linho Alabastro: fundo imersivo e repousante */
  --color-surface: #FFFFFF;         /* Branco Puro: cartões e folhas de ação */
  --color-surface-subtle: #F3EFE9;  /* Pedra Quente: contêineres de inputs e tags */
  --color-surface-hover: #ECE7DF;

  /* Tipografia Espresso Profundo */
  --color-text-primary: #1C1917;    /* Stone 900: leitura de altíssimo contraste */
  --color-text-secondary: #716D66;  /* Stone 500: contexto e legendas secundárias */
  --color-text-tertiary: #A8A29A;   /* Stone 400: placeholders e estados inativos */

  /* Cores de Acento e Identidade */
  --color-brand-terracotta: #D9532F; /* Terracota Vivo: CTAs quentes e marca */
  --color-brand-terracotta-soft: #FDEEE9;
  
  /* Verde Sálvia & Oliva (Sucesso, Carrinho & Conclusão) */
  --color-sage-deep: #26593F;       /* Verde Folha: confirmações, total no carrinho */
  --color-sage-surface: #ECF5F0;    /* Verde Pastel: badges de itens comprados */
  
  /* Âmbar Ocre (Orçamento & Alertas Amigáveis) */
  --color-amber-alert: #D97706;     /* Âmbar: orçamento próximo do limite (>85%) */
  --color-amber-surface: #FEF3C7;
  
  /* Divisores Estruturais */
  --color-divider: #EAE6DF;         /* Traço ultra suave de 1px apenas onde vital */
}
```

---

## 3. Tipografia & Escala Modular

Utilizamos **Plus Jakarta Sans** (com fallback `Inter, system-ui`), priorizando clareza geométrica e calor humanista.

| Nível | Tamanho / Leading | Peso | Aplicação |
|---|---|---|---|
| **Display (Hero)** | 28px / 34px | Semibold (600) | Saudação inicial, saldo disponível |
| **Headline** | 20px / 26px | Semibold (600) | Títulos de seções, nome do supermercado |
| **Title Medium** | 16px / 22px | Medium (500) | Nomes de produtos, títulos de cards |
| **Body Large** | 15px / 22px | Regular (400) | Textos corridos, inputs de texto |
| **Body Small** | 13px / 18px | Regular (400) | Categorias, unidades, notas |
| **Numeric Value** | 24px-36px | Bold (700) + `font-mono tabular-nums` | Contador acumulado do carrinho e calculadora |

> [!IMPORTANT]
> Todos os valores monetários (`R$ 0,00`) e quantidades utilizam a classe Tailwind `tabular-nums`, prevenindo deslocamentos horizontais involuntários durante a digitação no carrinho.

---

## 4. Componentes Autorais da Experiência

### 4.1. Floating Thumb-Nav (Bottom Navigation)
- Doca flutuante suspensa a 12px da base da tela, respeitando a safe area do iPhone (`pb-safe`).
- Material: Efeito vidro fosco translúcido (`backdrop-blur-xl bg-white/85 border border-stone-200/50 shadow-[0_8px_30px_rgb(0,0,0,0.06)]`).
- Cantos arredondados contínuos (`rounded-full`).
- 4 destinos:
  1. **Início** (Ícone Home minimalista).
  2. **Recorrente** (Ícone de Reposição / Caderno).
  3. **Supermercado** (Ícone Cesta / Carrinho com ponto verde quando ativo).
  4. **Histórico** (Ícone Gráfico / Relógio).
- Microinteração: Indicador em pílula elástica com `layoutId="nav-indicator"` via Motion.

### 4.2. Sticky Shopping HUD (Orçamentômetro Vivo)
- Fixado no topo durante a compra.
- Exibe em tipografia grande:
  - **Total no Carrinho:** Ex: `R$ 284,50`.
  - **Saldo Restante:** Ex: `R$ 215,50 restantes de R$ 500,00`.
- Barra de Progresso Orgânica (altura de 4px):
  - 0% a 85%: Verde Sálvia calmo.
  - 85% a 100%: Mostarda suave de atenção.
  - > 100%: Terracota elegante sinalizando estouro de orçamento sem alarme estridente.

### 4.3. Card de Produto & Check-In Tátil
- Fundo branco limpo, sem contorno pesado, separado por espaçamento de 8px e divisores quase imperceptíveis.
- Lado esquerdo: Checkbox circular generoso (32x32px) com preenchimento sálvia animado.
- Centro: Nome do produto com quantidade padrão (ex: `Leite Integral · 4 cx`).
- Lado direito: Subtotal ou preço unitário em `tabular-nums`.
- Ação: Ao marcar, o item ganha um leve strike-through animado, fade de 0.6 e é movido para a gaveta "No Carrinho".

### 4.4. Bottom Sheet de Teclado Numérico Rápido (One-Thumb Pad)
- Ao adicionar um item ou editar preço no supermercado, não abrimos o teclado padrão do sistema operacional (que empurra a tela de forma desajeitada).
- Abrimos uma folha inferior ergonômica com teclado numérico dedicado (dígitos grandes `1-9`, tecla `00`, tecla vírgula `,` e botão gigante de confirmação "Colocar no Carrinho").

---

## 5. Microinterações e Feedback Sensorial

- **Haptic Feedback:** Vibrações táteis sutis (`navigator.vibrate([15])`) ao marcar itens no carrinho em navegadores móveis suportados.
- **Feedback de Sincronização:** Pequeno ponto pulsante na cor sálvia no cabeçalho com o avatar sutil do parceiro quando ambos estão simultaneamente na lista.
- **Respeito a Preferências:** Animações desabilitadas via `@media (prefers-reduced-motion: reduce)`.