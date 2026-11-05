import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/';

  if (code) {
    const supabase = await createClient();
    const { data: { user }, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && user) {
      // Sincroniza foto e nome do Google no perfil
      const avatarUrl = user.user_metadata?.avatar_url || user.user_metadata?.picture || null;
      const fullName = user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split('@')[0] || 'Usuário';

      try {
        await (supabase as any).from('profiles').upsert({
          id: user.id,
          full_name: fullName,
          avatar_url: avatarUrl,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'id' });
      } catch {
        // Silently continue if profiles update encounters constraint
      }

      // Se veio com destino explícito (ex: convite), prioriza
      if (next.startsWith('/invite/')) {
        return NextResponse.redirect(`${origin}${next}`);
      }

      // Verifica se o usuário já possui um lar configurado
      const { data: member } = await supabase
        .from('household_members')
        .select('household_id, households(onboarding_completed_at)')
        .eq('user_id', user.id)
        .limit(1)
        .maybeSingle();

      if (!member) {
        // Novo usuário sem lar -> direciona para o Onboarding
        return NextResponse.redirect(`${origin}/onboarding`);
      }

      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  // Fallback em caso de erro no callback
  return NextResponse.redirect(`${origin}/login?error=auth-callback-failed`);
}
