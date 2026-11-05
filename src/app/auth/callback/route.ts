import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
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

      // Verifica se há token de convite explícito na URL ou nos cookies
      const cookieStore = await cookies();
      const inviteCookie = cookieStore.get('despensa_invite_token')?.value;

      if (next.startsWith('/invite/')) {
        return NextResponse.redirect(`${origin}${next}`);
      }

      if (inviteCookie) {
        return NextResponse.redirect(`${origin}/invite/${inviteCookie}`);
      }

      // Se tem destino válido diferente da raiz
      if (next && next !== '/' && !next.startsWith('/login') && !next.startsWith('/register')) {
        return NextResponse.redirect(`${origin}${next}`);
      }

      // Verifica se o usuário já possui um lar configurado (pega o mais recente)
      const { data: member } = await supabase
        .from('household_members')
        .select('household_id, households(onboarding_completed_at)')
        .eq('user_id', user.id)
        .order('joined_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!member) {
        // Novo usuário sem lar -> direciona para o Onboarding
        return NextResponse.redirect(`${origin}/onboarding`);
      }

      return NextResponse.redirect(`${origin}/`);
    }
  }

  // Fallback em caso de erro no callback
  return NextResponse.redirect(`${origin}/login?error=auth-callback-failed`);
}
