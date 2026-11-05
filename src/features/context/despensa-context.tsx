'use client';

import React, { createContext, useContext, useEffect, useState, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { EXPANDED_CATEGORIES, CategorySeed } from '@/lib/constants/initial-data';
import { isSupabaseConfigured, createClient } from '@/lib/supabase/client';
import { triggerHaptic } from '@/lib/haptics';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatar_url?: string | null;
  role: 'admin' | 'member';
}

export interface Household {
  id: string;
  name: string;
  monthly_budget: number;
  currency: string;
  shopping_frequency?: string;
  invite_token?: string;
  average_ticket_target?: number;
  onboarding_completed_at?: string | null;
  members: UserProfile[];
}

export interface ProductItem {
  id: string;
  name: string;
  category_id: string;
  default_unit: string;
  default_price: number;
  notes?: string;
}

export interface RecurringItem {
  id: string;
  product_id: string;
  target_quantity: number;
  unit: string;
  is_active: boolean;
}

export interface ShoppingListItem {
  id: string;
  shopping_list_id: string;
  product_id?: string;
  custom_name: string;
  category_id: string;
  planned_quantity: number;
  unit: string;
  estimated_price: number;
  is_added_during_shopping?: boolean;
}

export interface CartItem {
  id: string;
  shopping_session_id: string;
  shopping_list_item_id?: string;
  product_id?: string;
  item_name: string;
  category_id: string;
  quantity: number;
  unit_price: number;
  discount: number;
  subtotal: number;
  checked_by?: string;
  checked_at?: string;
}

export interface ShoppingSession {
  id: string;
  shopping_list_id?: string;
  household_id: string;
  started_by: string;
  started_at: string;
  finished_at?: string;
  budget_target: number;
  total_spent: number;
  total_items_count: number;
  status: 'in_progress' | 'completed' | 'cancelled';
  cart_items: CartItem[];
}

export interface CompletedShoppingSummary {
  id: string;
  title: string;
  date: string;
  total_spent: number;
  budget_target: number;
  items_count: number;
  cart_items: CartItem[];
}

interface DespensaContextType {
  isLoading: boolean;
  currentUser: UserProfile;
  household: Household;
  refreshData: () => Promise<void>;
  updateHouseholdBudget: (newBudget: number) => Promise<void>;
  generateInviteLink: () => Promise<string>;
  logout: () => Promise<void>;
  categories: CategorySeed[];
  products: ProductItem[];
  addProduct: (product: Omit<ProductItem, 'id'>) => Promise<ProductItem>;
  updateProduct: (id: string, updates: Partial<ProductItem>) => Promise<void>;
  deleteProduct: (id: string) => Promise<void>;
  recurringItems: RecurringItem[];
  toggleRecurringItem: (productId: string) => Promise<void>;
  updateRecurringQuantity: (productId: string, quantity: number, unit?: string) => Promise<void>;
  // Lista Mensal
  currentShoppingList: {
    id: string;
    title: string;
    month: number;
    year: number;
    items: ShoppingListItem[];
  } | null;
  generateMonthlyList: () => Promise<void>;
  addExtraListItem: (item: { name: string; category_id: string; quantity: number; unit: string; price: number }) => Promise<void>;
  removeListItem: (itemId: string) => Promise<void>;
  // Modo Supermercado
  activeSession: ShoppingSession | null;
  startShoppingSession: () => Promise<void>;
  checkItemInCart: (params: {
    listItemId?: string;
    product_id?: string;
    name: string;
    category_id: string;
    quantity: number;
    unit_price: number;
    discount?: number;
  }) => Promise<void>;
  addExtraItemToCart: (params: {
    name: string;
    category_id: string;
    unit: string;
    quantity: number;
    unit_price: number;
    discount?: number;
  }) => Promise<void>;
  undoCartItem: (cartItemId: string) => Promise<void>;
  finishShoppingSession: () => Promise<void>;
  cancelShoppingSession: () => Promise<void>;
  // Histórico
  history: CompletedShoppingSummary[];
  // Cálculos ao vivo
  shoppingStats: {
    totalSpent: number;
    budget: number;
    remaining: number;
    percentUsed: number;
    boughtCount: number;
    pendingCount: number;
  };
}

const DespensaContext = createContext<DespensaContextType | undefined>(undefined);

export function DespensaProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  const [isLoading, setIsLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<UserProfile>({
    id: 'user-auth-init',
    name: 'Você',
    email: '',
    avatar_url: null,
    role: 'admin',
  });

  const [household, setHousehold] = useState<Household>({
    id: '',
    name: 'Nosso Lar',
    monthly_budget: 0,
    currency: 'BRL',
    members: [],
  });

  const [categories, setCategories] = useState<CategorySeed[]>(EXPANDED_CATEGORIES);
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [recurringItems, setRecurringItems] = useState<RecurringItem[]>([]);
  const [currentShoppingList, setCurrentShoppingList] = useState<{
    id: string;
    title: string;
    month: number;
    year: number;
    items: ShoppingListItem[];
  } | null>(null);

  const [activeSession, setActiveSession] = useState<ShoppingSession | null>(null);
  const [history, setHistory] = useState<CompletedShoppingSummary[]>([]);

  // Carrega e sincroniza todos os dados reais do Supabase
  const refreshData = useCallback(async () => {
    try {
      const supabase = createClient() as any;
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) return;

      const userName = user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split('@')[0] || 'Você';
      const userAvatar = user.user_metadata?.avatar_url || user.user_metadata?.picture || null;

      setCurrentUser({
        id: user.id,
        name: userName,
        email: user.email || '',
        avatar_url: userAvatar,
        role: 'admin',
      });

      // 1. Busca Household do Usuário
      const { data: member, error: memberErr } = await supabase
        .from('household_members')
        .select('household_id, role, households(*)')
        .eq('user_id', user.id)
        .order('joined_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (memberErr) {
        console.error('Erro ao buscar household_members:', memberErr);
      }

      if (!member) return;

      let rawH: any = member.households;
      let h = Array.isArray(rawH) ? rawH[0] : rawH;

      // Fallback: se o join não retornou mas temos o household_id, busca diretamente
      if (!h && member.household_id) {
        const { data: directH, error: directHErr } = await supabase
          .from('households')
          .select('*')
          .eq('id', member.household_id)
          .maybeSingle();

        if (directHErr) {
          console.error('Erro ao buscar household diretamente:', directHErr);
        }
        h = directH;
      }

      if (!h) return;

      // 2. Busca Todos os Membros do Lar
      const { data: allMembers } = await supabase
        .from('household_members')
        .select('role, user_id, profiles(full_name, avatar_url)')
        .eq('household_id', h.id);

      const membersList: UserProfile[] = (allMembers || []).map((m: any) => {
        const profile = m.profiles as { full_name?: string; avatar_url?: string } | null;
        return {
          id: m.user_id,
          name: profile?.full_name || (m.user_id === user.id ? userName : 'Participante'),
          email: '',
          avatar_url: profile?.avatar_url || (m.user_id === user.id ? userAvatar : null),
          role: m.role as 'admin' | 'member',
        };
      });

      const budgetVal = Number(h.monthly_budget) || 0;
      const freq = h.shopping_frequency || 'monthly';
      const tripsPerMonth = freq === 'weekly' ? 4 : freq === 'biweekly' ? 2 : 1;
      const computedTicket = Number(h.average_ticket_target) > 0 
        ? Number(h.average_ticket_target) 
        : (budgetVal > 0 ? Math.round((budgetVal / tripsPerMonth) * 100) / 100 : 0);

      setHousehold({
        id: h.id,
        name: h.name || 'Nosso Lar',
        monthly_budget: budgetVal,
        currency: h.currency || 'BRL',
        shopping_frequency: freq,
        average_ticket_target: computedTicket,
        onboarding_completed_at: h.onboarding_completed_at,
        members: membersList,
      });

      // 3. Busca Categorias do Lar
      const { data: dbCategories } = await supabase
        .from('categories')
        .select('*')
        .eq('household_id', h.id)
        .order('sort_order', { ascending: true });

      if (dbCategories && dbCategories.length > 0) {
        setCategories(
          dbCategories.map((c: any) => ({
            id: c.id,
            name: c.name,
            icon: c.icon,
            color: c.color,
            sort_order: c.sort_order,
          }))
        );
      }

      // 4. Busca Produtos do Catálogo
      const { data: dbProducts } = await supabase
        .from('products')
        .select('*')
        .eq('household_id', h.id)
        .order('created_at', { ascending: false });

      if (dbProducts) {
        setProducts(
          dbProducts.map((p: any) => ({
            id: p.id,
            name: p.name,
            category_id: p.category_id || 'cat-graos',
            default_unit: p.default_unit,
            default_price: Number(p.default_price),
            notes: p.notes || undefined,
          }))
        );
      }

      // 5. Busca Itens Recorrentes
      const { data: dbRecurring } = await supabase
        .from('recurring_items')
        .select('*')
        .eq('household_id', h.id)
        .order('sort_order', { ascending: true });

      if (dbRecurring) {
        setRecurringItems(
          dbRecurring.map((r: any) => ({
            id: r.id,
            product_id: r.product_id,
            target_quantity: Number(r.target_quantity),
            unit: r.unit,
            is_active: r.is_active,
          }))
        );
      }

      // 6. Busca Lista Mensal Ativa
      const currentMonth = new Date().getMonth() + 1;
      const currentYear = new Date().getFullYear();

      const { data: dbLists } = await supabase
        .from('shopping_lists')
        .select('*, shopping_list_items(*)')
        .eq('household_id', h.id)
        .in('status', ['draft', 'active'])
        .order('created_at', { ascending: false })
        .limit(1);

      if (dbLists && dbLists.length > 0) {
        const activeList = dbLists[0];
        let itemsList = activeList.shopping_list_items || [];

        // Auto-sincroniza caso a lista exista mas esteja sem itens e haja itens recorrentes
        if (itemsList.length === 0 && dbRecurring && dbRecurring.length > 0) {
          await supabase.rpc('get_or_create_monthly_list', {
            p_household_id: h.id,
            p_month: currentMonth,
            p_year: currentYear,
            p_budget: Number(h.monthly_budget) || 0,
          });

          const { data: syncedItems } = await supabase
            .from('shopping_list_items')
            .select('*')
            .eq('shopping_list_id', activeList.id);

          if (syncedItems && syncedItems.length > 0) {
            itemsList = syncedItems;
          }
        }

        setCurrentShoppingList({
          id: activeList.id,
          title: activeList.title,
          month: activeList.period_month,
          year: activeList.period_year,
          items: itemsList.map((item: any) => ({
            id: item.id,
            shopping_list_id: item.shopping_list_id,
            product_id: item.product_id || undefined,
            custom_name: item.custom_name,
            category_id: item.category_id || 'cat-graos',
            planned_quantity: Number(item.planned_quantity),
            unit: item.unit,
            estimated_price: Number(item.estimated_price),
            is_added_during_shopping: item.is_added_during_shopping,
          })),
        });
      } else {
        // Se ainda não houver lista no banco, chama get_or_create_monthly_list via RPC
        const { data: listId } = await supabase.rpc('get_or_create_monthly_list', {
          p_household_id: h.id,
          p_month: currentMonth,
          p_year: currentYear,
          p_budget: Number(h.monthly_budget) || 0,
        });

        if (listId) {
          const { data: createdList } = await supabase
            .from('shopping_lists')
            .select('*, shopping_list_items(*)')
            .eq('id', listId)
            .single();

          if (createdList) {
            setCurrentShoppingList({
              id: createdList.id,
              title: createdList.title,
              month: createdList.period_month,
              year: createdList.period_year,
              items: (createdList.shopping_list_items || []).map((item: any) => ({
                id: item.id,
                shopping_list_id: item.shopping_list_id,
                product_id: item.product_id || undefined,
                custom_name: item.custom_name,
                category_id: item.category_id || 'cat-graos',
                planned_quantity: Number(item.planned_quantity),
                unit: item.unit,
                estimated_price: Number(item.estimated_price),
                is_added_during_shopping: item.is_added_during_shopping,
              })),
            });
          }
        }
      }

      // 7. Busca Sessão de Compras Ativa no Banco
      const { data: activeSessions } = await supabase
        .from('shopping_sessions')
        .select('*, cart_items(*)')
        .eq('household_id', h.id)
        .eq('status', 'in_progress')
        .order('started_at', { ascending: false })
        .limit(1);

      if (activeSessions && activeSessions.length > 0) {
        const s = activeSessions[0];
        const loadedCartItems = (s.cart_items || []).map((c: any) => ({
          id: c.id,
          shopping_session_id: c.shopping_session_id,
          shopping_list_item_id: c.shopping_list_item_id || undefined,
          product_id: c.product_id || undefined,
          item_name: c.item_name,
          category_id: c.category_id || 'cat-graos',
          quantity: Number(c.quantity),
          unit_price: Number(c.unit_price),
          discount: Number(c.discount) || 0,
          subtotal: Number(c.subtotal),
          checked_by: c.checked_by || undefined,
          checked_at: c.checked_at || undefined,
        }));

        const calculatedSpent = loadedCartItems.reduce(
          (acc: number, c: any) => acc + (Number(c.subtotal) || 0),
          0
        );

        setActiveSession({
          id: s.id,
          household_id: s.household_id,
          shopping_list_id: s.shopping_list_id || undefined,
          started_by: s.started_by,
          started_at: s.started_at,
          budget_target: Number(s.budget_target),
          total_spent: calculatedSpent,
          total_items_count: loadedCartItems.length,
          status: 'in_progress',
          cart_items: loadedCartItems,
        });
      } else {
        setActiveSession(null);
      }

      // 8. Busca Histórico de Compras Concluídas
      const { data: dbSessions } = await supabase
        .from('shopping_sessions')
        .select('*, cart_items(*)')
        .eq('household_id', h.id)
        .eq('status', 'completed')
        .order('finished_at', { ascending: false });

      if (dbSessions) {
        setHistory(
          dbSessions.map((s: any) => ({
            id: s.id,
            title: 'Compras Concluídas',
            date: s.finished_at || s.started_at,
            total_spent: Number(s.total_spent),
            budget_target: Number(s.budget_target),
            items_count: s.total_items_count,
            cart_items: (s.cart_items || []).map((ci: any) => ({
              id: ci.id,
              shopping_session_id: ci.shopping_session_id,
              shopping_list_item_id: ci.shopping_list_item_id,
              product_id: ci.product_id,
              item_name: ci.item_name,
              category_id: ci.category_id,
              quantity: Number(ci.quantity),
              unit_price: Number(ci.unit_price),
              discount: Number(ci.discount) || 0,
              subtotal: Number(ci.subtotal),
              checked_by: ci.checked_by,
              checked_at: ci.checked_at,
            })),
          }))
        );
      }
    } catch (err) {
      console.error('Erro ao sincronizar dados com Supabase:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Sincronização inicial ao montar
  useEffect(() => {
    refreshData();

    if (!isSupabaseConfigured()) return;
    const supabase = createClient() as any;

    const { data: authListener } = supabase.auth.onAuthStateChange((event: string) => {
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        refreshData();
      } else if (event === 'SIGNED_OUT') {
        router.push('/login');
      }
    });

    return () => {
      authListener?.subscription?.unsubscribe();
    };
  }, [refreshData, router]);

  // Sincronização Realtime de cart_items e shopping_sessions
  useEffect(() => {
    if (!household.id) return;

    const supabase = createClient() as any;
    const channel = supabase
      .channel(`shopping_sync_${household.id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'cart_items' },
        () => {
          refreshData();
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'shopping_sessions' },
        () => {
          refreshData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [household.id, refreshData]);

  // Logout Real
  const logout = useCallback(async () => {
    triggerHaptic('light');
    try {
      const supabase = createClient() as any;
      await supabase.auth.signOut();
      router.push('/login');
    } catch {
      router.push('/login');
    }
  }, [router]);

  // Atualizar Orçamento do Lar
  const updateHouseholdBudget = useCallback(
    async (newBudget: number) => {
      setHousehold((prev) => ({ ...prev, monthly_budget: newBudget }));
      try {
        const supabase = createClient() as any;
        if (household.id) {
          await supabase
            .from('households')
            .update({ monthly_budget: newBudget, updated_at: new Date().toISOString() })
            .eq('id', household.id);
        }
      } catch (err) {
        console.error(err);
      }
    },
    [household.id]
  );

  // Gerar Link de Convite
  const generateInviteLink = useCallback(async () => {
    const token = Math.random().toString(36).substring(2, 12);
    setHousehold((prev) => ({ ...prev, invite_token: token }));

    try {
      const supabase = createClient() as any;
      const { data: { user } } = await supabase.auth.getUser();
      if (user && household.id) {
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 7);

        await supabase.from('household_invitations').insert({
          household_id: household.id,
          invited_by: user.id,
          token: token,
          expires_at: expiresAt.toISOString(),
          status: 'pending',
        });
      }
    } catch (err) {
      console.error(err);
    }

    const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';
    return `${baseUrl}/invite/${token}`;
  }, [household.id]);

  // Helper para garantir UUID válido para colunas de category_id
  const toValidUuid = useCallback((id?: string | null): string | null => {
    if (!id) return null;
    if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
      return id;
    }
    const seed = EXPANDED_CATEGORIES.find((c) => c.id === id);
    const found = categories.find(
      (c) => c.id === id || (seed && c.name.toLowerCase() === seed.name.toLowerCase())
    );
    if (found && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(found.id)) {
      return found.id;
    }
    return null;
  }, [categories]);

  // Adicionar Produto ao Catálogo, Recorrente e Lista Mensal Ativa
  const addProduct = useCallback(
    async (product: Omit<ProductItem, 'id'>) => {
      const supabase = createClient() as any;
      let newId = `prod-${Date.now()}`;
      let createdListItem: ShoppingListItem | null = null;
      const validCatId = toValidUuid(product.category_id);

      if (household.id) {
        const { data: created } = await supabase
          .from('products')
          .insert({
            household_id: household.id,
            name: product.name,
            category_id: validCatId,
            default_unit: product.default_unit,
            default_price: product.default_price,
            notes: product.notes || null,
          })
          .select('id')
          .single();

        if (created?.id) {
          newId = created.id;
          await supabase.from('recurring_items').insert({
            household_id: household.id,
            product_id: newId,
            target_quantity: 1,
            unit: product.default_unit,
            is_active: true,
          });

          // Se existe lista mensal ativa, insere diretamente em shopping_list_items
          if (currentShoppingList?.id) {
            const { data: insertedSli } = await supabase
              .from('shopping_list_items')
              .insert({
                shopping_list_id: currentShoppingList.id,
                product_id: newId,
                custom_name: product.name,
                category_id: validCatId,
                planned_quantity: 1,
                unit: product.default_unit,
                estimated_price: product.default_price,
                is_added_during_shopping: Boolean(activeSession),
              })
              .select()
              .single();

            if (insertedSli) {
              createdListItem = {
                id: insertedSli.id,
                shopping_list_id: insertedSli.shopping_list_id,
                product_id: insertedSli.product_id,
                custom_name: insertedSli.custom_name,
                category_id: insertedSli.category_id || 'cat-graos',
                planned_quantity: Number(insertedSli.planned_quantity),
                unit: insertedSli.unit,
                estimated_price: Number(insertedSli.estimated_price),
                is_added_during_shopping: insertedSli.is_added_during_shopping,
              };
            }
          }
        }
      }

      const newProd: ProductItem = { ...product, id: newId, category_id: validCatId || product.category_id };
      setProducts((prev) => [newProd, ...prev]);
      setRecurringItems((prev) => [
        {
          id: `rec-${newId}`,
          product_id: newId,
          target_quantity: 1,
          unit: product.default_unit,
          is_active: true,
        },
        ...prev,
      ]);

      if (createdListItem) {
        setCurrentShoppingList((prev) =>
          prev
            ? {
                ...prev,
                items: [...prev.items, createdListItem!],
              }
            : null
        );
      }

      await refreshData();
      triggerHaptic('success');
      return newProd;
    },
    [household.id, currentShoppingList?.id, activeSession, toValidUuid, refreshData]
  );

  const updateProduct = useCallback(
    async (id: string, updates: Partial<ProductItem>) => {
      setProducts((prev) =>
        prev.map((p) => (p.id === id ? { ...p, ...updates } : p))
      );
      try {
        const supabase = createClient() as any;
        await supabase.from('products').update(updates).eq('id', id);
      } catch (err) {
        console.error(err);
      }
    },
    []
  );

  const deleteProduct = useCallback(
    async (id: string) => {
      setProducts((prev) => prev.filter((p) => p.id !== id));
      setRecurringItems((prev) => prev.filter((r) => r.product_id !== id));
      try {
        const supabase = createClient() as any;
        await supabase.from('products').delete().eq('id', id);
      } catch (err) {
        console.error(err);
      }
      triggerHaptic('light');
    },
    []
  );

  const toggleRecurringItem = useCallback(
    async (productId: string) => {
      setRecurringItems((prev) =>
        prev.map((r) =>
          r.product_id === productId ? { ...r, is_active: !r.is_active } : r
        )
      );

      const target = recurringItems.find((r) => r.product_id === productId);
      const newActive = target ? !target.is_active : true;

      try {
        const supabase = createClient() as any;
        await supabase
          .from('recurring_items')
          .update({ is_active: newActive })
          .eq('product_id', productId)
          .eq('household_id', household.id);
      } catch (err) {
        console.error(err);
      }
      triggerHaptic('light');
    },
    [recurringItems, household.id]
  );

  const updateRecurringQuantity = useCallback(
    async (productId: string, quantity: number, unit?: string) => {
      setRecurringItems((prev) =>
        prev.map((r) =>
          r.product_id === productId
            ? { ...r, target_quantity: quantity, unit: unit || r.unit }
            : r
        )
      );

      try {
        const supabase = createClient() as any;
        await supabase
          .from('recurring_items')
          .update({
            target_quantity: quantity,
            ...(unit ? { unit } : {}),
          })
          .eq('product_id', productId)
          .eq('household_id', household.id);
      } catch (err) {
        console.error(err);
      }
    },
    [household.id]
  );

  // Gerar Lista Mensal Manualmente
  const generateMonthlyList = useCallback(async () => {
    const month = new Date().getMonth() + 1;
    const year = new Date().getFullYear();

    try {
      const supabase = createClient() as any;
      await supabase.rpc('get_or_create_monthly_list', {
        p_household_id: household.id,
        p_month: month,
        p_year: year,
        p_budget: household.monthly_budget,
      });

      await refreshData();
      triggerHaptic('success');
    } catch (err) {
      console.error(err);
    }
  }, [household.id, household.monthly_budget, refreshData]);

  const addExtraListItem = useCallback(
    async (item: { name: string; category_id: string; quantity: number; unit: string; price: number }) => {
      if (!currentShoppingList) return;

      try {
        const supabase = createClient() as any;
        const validCatId = toValidUuid(item.category_id);
        const { data: inserted } = await supabase
          .from('shopping_list_items')
          .insert({
            shopping_list_id: currentShoppingList.id,
            custom_name: item.name,
            category_id: validCatId,
            planned_quantity: item.quantity,
            unit: item.unit,
            estimated_price: item.price,
            is_added_during_shopping: Boolean(activeSession),
          })
          .select()
          .single();

        if (inserted) {
          setCurrentShoppingList((prev) =>
            prev
              ? {
                  ...prev,
                  items: [
                    ...prev.items,
                    {
                      id: inserted.id,
                      shopping_list_id: inserted.shopping_list_id,
                      custom_name: inserted.custom_name,
                      category_id: inserted.category_id || 'cat-graos',
                      planned_quantity: Number(inserted.planned_quantity),
                      unit: inserted.unit,
                      estimated_price: Number(inserted.estimated_price),
                      is_added_during_shopping: inserted.is_added_during_shopping,
                    },
                  ],
                }
              : null
          );
        }
      } catch (err) {
        console.error(err);
      }
      triggerHaptic('light');
    },
    [currentShoppingList, activeSession, toValidUuid]
  );

  const removeListItem = useCallback(async (itemId: string) => {
    setCurrentShoppingList((prev) =>
      prev ? { ...prev, items: prev.items.filter((i) => i.id !== itemId) } : null
    );
    try {
      const supabase = createClient() as any;
      await supabase.from('shopping_list_items').delete().eq('id', itemId);
    } catch (err) {
      console.error(err);
    }
    triggerHaptic('light');
  }, []);

  // MODO SUPERMERCADO: Iniciar ou Retomar Sessão Real no Banco
  const startShoppingSession = useCallback(async () => {
    try {
      const supabase = createClient() as any;
      const { data: sessionId, error } = await supabase.rpc(
        'start_or_resume_shopping_session',
        {
          p_household_id: household.id,
          p_user_id: currentUser.id,
          p_shopping_list_id: currentShoppingList?.id || null,
        }
      );

      if (sessionId) {
        await refreshData();
        triggerHaptic('success');
      }
    } catch (err) {
      console.error('Erro ao iniciar sessão:', err);
    }
  }, [household.id, currentUser.id, currentShoppingList?.id, refreshData]);

  // Mapeamento e Check de Item no Carrinho
  const checkItemInCart = useCallback(
    async (params: {
      listItemId?: string;
      product_id?: string;
      name: string;
      category_id: string;
      quantity: number;
      unit_price: number;
      discount?: number;
    }) => {
      if (!activeSession) return;

      const discount = params.discount || 0;
      const subtotal = Math.max(0, params.quantity * params.unit_price - discount);
      const validCatId = toValidUuid(params.category_id);
      const validUserId = currentUser.id && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(currentUser.id) ? currentUser.id : null;

      try {
        const supabase = createClient() as any;
        const { data: newCartItem, error: cartErr } = await supabase
          .from('cart_items')
          .insert({
            shopping_session_id: activeSession.id,
            shopping_list_item_id: params.listItemId || null,
            product_id: params.product_id || null,
            item_name: params.name,
            category_id: validCatId,
            quantity: params.quantity,
            unit_price: params.unit_price,
            discount: discount,
            checked_by: validUserId,
          })
          .select()
          .single();

        if (cartErr) {
          console.error('Erro ao inserir item no carrinho (Supabase):', cartErr);
        }

        if (newCartItem) {
          setActiveSession((prev) => {
            if (!prev) return null;
            const filtered = prev.cart_items.filter(
              (c) => !(params.listItemId && c.shopping_list_item_id === params.listItemId)
            );
            const itemObj: CartItem = {
              id: newCartItem.id,
              shopping_session_id: newCartItem.shopping_session_id,
              shopping_list_item_id: newCartItem.shopping_list_item_id || undefined,
              product_id: newCartItem.product_id || undefined,
              item_name: newCartItem.item_name,
              category_id: newCartItem.category_id || 'cat-graos',
              quantity: Number(newCartItem.quantity),
              unit_price: Number(newCartItem.unit_price),
              discount: Number(newCartItem.discount) || 0,
              subtotal: Number(newCartItem.subtotal) || subtotal,
              checked_by: currentUser.name,
              checked_at: newCartItem.checked_at,
            };
            const updated = [...filtered, itemObj];
            return {
              ...prev,
              cart_items: updated,
              total_spent: updated.reduce((acc, c) => acc + c.subtotal, 0),
              total_items_count: updated.length,
            };
          });
        }
      } catch (err) {
        console.error('Erro ao adicionar no carrinho:', err);
      }

      triggerHaptic('success');
    },
    [activeSession, currentUser, toValidUuid]
  );

  // Adicionar Produto Fora da Lista Diretamente no Carrinho
  const addExtraItemToCart = useCallback(
    async (params: {
      name: string;
      category_id: string;
      unit: string;
      quantity: number;
      unit_price: number;
      discount?: number;
    }) => {
      if (!activeSession) return;

      const discount = params.discount || 0;
      const subtotal = Math.max(0, params.quantity * params.unit_price - discount);
      const validCatId = toValidUuid(params.category_id);
      const validUserId = currentUser.id && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(currentUser.id) ? currentUser.id : null;

      try {
        const supabase = createClient() as any;

        // 1. Registra na lista atual com flag is_added_during_shopping
        let createdListItemId: string | undefined;
        if (activeSession.shopping_list_id) {
          const { data: newListItem } = await supabase
            .from('shopping_list_items')
            .insert({
              shopping_list_id: activeSession.shopping_list_id,
              custom_name: params.name,
              category_id: validCatId,
              planned_quantity: params.quantity,
              unit: params.unit,
              estimated_price: params.unit_price,
              is_added_during_shopping: true,
            })
            .select('id')
            .single();

          if (newListItem) {
            createdListItemId = newListItem.id;
          }
        }

        // 2. Registra no carrinho
        const { data: newCartItem, error: cartErr } = await supabase
          .from('cart_items')
          .insert({
            shopping_session_id: activeSession.id,
            shopping_list_item_id: createdListItemId || null,
            item_name: params.name,
            category_id: validCatId,
            quantity: params.quantity,
            unit_price: params.unit_price,
            discount: discount,
            checked_by: validUserId,
          })
          .select()
          .single();

        if (cartErr) {
          console.error('Erro ao inserir item extra no carrinho (Supabase):', cartErr);
        }

        if (newCartItem) {
          const itemObj: CartItem = {
            id: newCartItem.id,
            shopping_session_id: newCartItem.shopping_session_id,
            shopping_list_item_id: createdListItemId,
            item_name: newCartItem.item_name,
            category_id: newCartItem.category_id || 'cat-graos',
            quantity: Number(newCartItem.quantity),
            unit_price: Number(newCartItem.unit_price),
            discount: Number(newCartItem.discount) || 0,
            subtotal: Number(newCartItem.subtotal) || subtotal,
            checked_by: currentUser.name,
            checked_at: newCartItem.checked_at,
          };

          setActiveSession((prev) => {
            if (!prev) return null;
            const updated = [...prev.cart_items, itemObj];
            return {
              ...prev,
              cart_items: updated,
              total_spent: updated.reduce((acc, c) => acc + c.subtotal, 0),
              total_items_count: updated.length,
            };
          });

          await refreshData();
          triggerHaptic('success');
        }
      } catch (err) {
        console.error('Erro ao adicionar item avulso:', err);
      }
    },
    [activeSession, currentUser, toValidUuid, refreshData]
  );

  // Desmarcar / Remover do Carrinho
  const undoCartItem = useCallback(
    async (cartItemId: string) => {
      try {
        const supabase = createClient() as any;
        await supabase.from('cart_items').delete().eq('id', cartItemId);

        setActiveSession((prev) => {
          if (!prev) return null;
          const updated = prev.cart_items.filter((c) => c.id !== cartItemId);
          return {
            ...prev,
            cart_items: updated,
            total_spent: updated.reduce((acc, c) => acc + c.subtotal, 0),
            total_items_count: updated.length,
          };
        });
        triggerHaptic('light');
      } catch (err) {
        console.error('Erro ao remover do carrinho:', err);
      }
    },
    []
  );

  // Finalizar Compra
  const finishShoppingSession = useCallback(async () => {
    if (!activeSession) return;

    try {
      const supabase = createClient() as any;
      await supabase.rpc('finish_shopping_session', {
        p_session_id: activeSession.id,
      });

      setActiveSession(null);
      await refreshData();
      triggerHaptic('success');
    } catch (err) {
      console.error('Erro ao finalizar compra:', err);
    }
  }, [activeSession, refreshData]);

  // Cancelar Compra
  const cancelShoppingSession = useCallback(async () => {
    if (!activeSession) return;

    try {
      const supabase = createClient() as any;
      await supabase
        .from('shopping_sessions')
        .update({ status: 'cancelled', finished_at: new Date().toISOString() })
        .eq('id', activeSession.id);

      setActiveSession(null);
      await refreshData();
      triggerHaptic('warning');
    } catch (err) {
      console.error('Erro ao cancelar sessão:', err);
    }
  }, [activeSession, refreshData]);

  // Cálculos do HUD e Dashboard
  const shoppingStats = useMemo(() => {
    const totalSpent = (activeSession?.cart_items || []).reduce(
      (acc, c) => acc + (Number(c.subtotal) || 0),
      0
    );
    const budget = household.monthly_budget;
    const remaining = Math.max(0, budget - totalSpent);
    const percentUsed = budget > 0 ? (totalSpent / budget) * 100 : 0;
    const boughtCount = activeSession?.cart_items.length || 0;

    const cartListItemIds = new Set(
      activeSession?.cart_items.map((c) => c.shopping_list_item_id).filter(Boolean)
    );
    const pendingCount = (currentShoppingList?.items.length || 0) - cartListItemIds.size;

    return {
      totalSpent,
      budget,
      remaining,
      percentUsed,
      boughtCount,
      pendingCount: Math.max(0, pendingCount),
    };
  }, [activeSession, household.monthly_budget, currentShoppingList]);

  const value = {
    isLoading,
    currentUser,
    household,
    refreshData,
    updateHouseholdBudget,
    generateInviteLink,
    logout,
    categories,
    products,
    addProduct,
    updateProduct,
    deleteProduct,
    recurringItems,
    toggleRecurringItem,
    updateRecurringQuantity,
    currentShoppingList,
    generateMonthlyList,
    addExtraListItem,
    removeListItem,
    activeSession,
    startShoppingSession,
    checkItemInCart,
    addExtraItemToCart,
    undoCartItem,
    finishShoppingSession,
    cancelShoppingSession,
    history,
    shoppingStats,
  };

  return <DespensaContext.Provider value={value}>{children}</DespensaContext.Provider>;
}

export function useDespensa() {
  const context = useContext(DespensaContext);
  if (!context) {
    throw new Error('useDespensa deve ser utilizado dentro de DespensaProvider');
  }
  return context;
}
