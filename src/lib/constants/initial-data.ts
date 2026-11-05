export interface CategorySeed {
  id: string;
  name: string;
  icon: string;
  color: string;
  sort_order: number;
}

export interface SuggestedProduct {
  id: string;
  name: string;
  category_id: string;
  default_unit: string;
  default_price: number;
  target_qty: number;
}

export const EXPANDED_CATEGORIES: CategorySeed[] = [
  { id: 'cat-graos', name: 'Arroz, Feijão & Grãos', icon: 'BowlFood', color: '#D9532F', sort_order: 1 },
  { id: 'cat-massas', name: 'Massas & Molhos', icon: 'CookingPot', color: '#EA580C', sort_order: 2 },
  { id: 'cat-oleos', name: 'Óleos, Azeites & Temperos', icon: 'Drop', color: '#CA8A04', sort_order: 3 },
  { id: 'cat-cafes', name: 'Açúcar, Cafés & Chás', icon: 'Coffee', color: '#854D0E', sort_order: 4 },
  { id: 'cat-leites', name: 'Leites & Bebidas Vegetais', icon: 'Brandy', color: '#0284C7', sort_order: 5 },
  { id: 'cat-queijos', name: 'Queijos & Frios', icon: 'Cheese', color: '#F59E0B', sort_order: 6 },
  { id: 'cat-carnes', name: 'Carnes & Aves', icon: 'Knife', color: '#DC2626', sort_order: 7 },
  { id: 'cat-peixes', name: 'Peixes & Frutos do Mar', icon: 'Fish', color: '#0EA5E9', sort_order: 8 },
  { id: 'cat-ovos', name: 'Ovos', icon: 'Egg', color: '#D97706', sort_order: 9 },
  { id: 'cat-padaria', name: 'Pães & Padaria', icon: 'Bread', color: '#B45309', sort_order: 10 },
  { id: 'cat-frutas', name: 'Frutas Frescas', icon: 'AppleLogo', color: '#16A34A', sort_order: 11 },
  { id: 'cat-verduras', name: 'Verduras & Folhas', icon: 'Plant', color: '#15803D', sort_order: 12 },
  { id: 'cat-legumes', name: 'Legumes & Raízes', icon: 'Carrot', color: '#C2410C', sort_order: 13 },
  { id: 'cat-bebidas', name: 'Bebidas & Sucos', icon: 'Wine', color: '#6366F1', sort_order: 14 },
  { id: 'cat-congelados', name: 'Congelados & Prontos', icon: 'Snowflake', color: '#38BDF8', sort_order: 15 },
  { id: 'cat-snacks', name: 'Biscoitos & Snacks', icon: 'Cookie', color: '#A16207', sort_order: 16 },
  { id: 'cat-doces', name: 'Doces & Sobremesas', icon: 'Cake', color: '#EC4899', sort_order: 17 },
  { id: 'cat-limpeza', name: 'Limpeza da Casa', icon: 'Sparkle', color: '#0D9488', sort_order: 18 },
  { id: 'cat-lavanderia', name: 'Lavanderia & Roupas', icon: 'TShirt', color: '#0891B2', sort_order: 19 },
  { id: 'cat-higiene', name: 'Higiene Pessoal & Banho', icon: 'Shower', color: '#7C3AED', sort_order: 20 },
  { id: 'cat-cuidado-pele', name: 'Cuidados Cabelo & Pele', icon: 'HandSoap', color: '#9333EA', sort_order: 21 },
  { id: 'cat-bucal', name: 'Higiene Bucal', icon: 'Smiley', color: '#2563EB', sort_order: 22 },
  { id: 'cat-descartaveis', name: 'Descartáveis & Utilidades', icon: 'Trash', color: '#64748B', sort_order: 23 },
  { id: 'cat-pet', name: 'Pet Shop', icon: 'PawPrint', color: '#78716C', sort_order: 24 },
  { id: 'cat-outros', name: 'Outros', icon: 'DotsThree', color: '#716D66', sort_order: 25 },
];

// Sugestões para escolha explícita do usuário durante o Onboarding (não inseridas automaticamente)
export const ONBOARDING_PRODUCT_SUGGESTIONS: SuggestedProduct[] = [
  { id: 'sug-1', name: 'Arroz Branco Tipo 1 (5kg)', category_id: 'cat-graos', default_unit: 'pct', default_price: 28.90, target_qty: 1 },
  { id: 'sug-2', name: 'Feijão Carioca Nobre (1kg)', category_id: 'cat-graos', default_unit: 'kg', default_price: 8.50, target_qty: 2 },
  { id: 'sug-3', name: 'Azeite de Oliva Extra Virgem', category_id: 'cat-oleos', default_unit: 'un', default_price: 38.90, target_qty: 1 },
  { id: 'sug-4', name: 'Café Torrado e Moído (500g)', category_id: 'cat-cafes', default_unit: 'pct', default_price: 22.00, target_qty: 2 },
  { id: 'sug-5', name: 'Leite Integral Fresco (1L)', category_id: 'cat-leites', default_unit: 'cx', default_price: 4.90, target_qty: 6 },
  { id: 'sug-6', name: 'Queijo Mussarela Fatiado', category_id: 'cat-queijos', default_unit: 'g', default_price: 18.00, target_qty: 400 },
  { id: 'sug-7', name: 'Ovos Caipiras (dúzia)', category_id: 'cat-ovos', default_unit: 'cx', default_price: 16.50, target_qty: 2 },
  { id: 'sug-8', name: 'Pão Francês Fresco', category_id: 'cat-padaria', default_unit: 'un', default_price: 1.20, target_qty: 8 },
  { id: 'sug-9', name: 'Banana Prata', category_id: 'cat-frutas', default_unit: 'kg', default_price: 7.90, target_qty: 1.5 },
  { id: 'sug-10', name: 'Tomate Italiano', category_id: 'cat-legumes', default_unit: 'kg', default_price: 9.50, target_qty: 1 },
  { id: 'sug-11', name: 'Filé de Frango Sassami', category_id: 'cat-carnes', default_unit: 'kg', default_price: 23.90, target_qty: 2 },
  { id: 'sug-12', name: 'Sabão Líquido Lava-Roupas', category_id: 'cat-lavanderia', default_unit: 'l', default_price: 34.90, target_qty: 1 },
  { id: 'sug-13', name: 'Amaciante de Roupas', category_id: 'cat-lavanderia', default_unit: 'un', default_price: 18.90, target_qty: 1 },
  { id: 'sug-14', name: 'Papel Higiênico Folha Dupla (12un)', category_id: 'cat-higiene', default_unit: 'pct', default_price: 24.90, target_qty: 1 },
  { id: 'sug-15', name: 'Creme Dental Proteção Diária', category_id: 'cat-bucal', default_unit: 'un', default_price: 6.90, target_qty: 2 },
];
