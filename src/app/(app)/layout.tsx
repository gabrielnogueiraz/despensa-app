import React from 'react';
import { AppHeader } from '@/components/common/app-header';
import { DesktopSidebar } from '@/components/common/desktop-sidebar';
import { BottomNav } from '@/components/common/bottom-nav';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-[#FAF8F5]">
      {/* Navegação Lateral Desktop (1024px+) */}
      <DesktopSidebar />

      {/* Área Principal de Conteúdo */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header exclusivo para Mobile */}
        <AppHeader />

        <main className="flex-1 w-full max-w-5xl mx-auto px-4 lg:px-8 pt-4 pb-28 lg:pb-12">
          {children}
        </main>
      </div>

      {/* Navegação Inferior Mobile */}
      <BottomNav />
    </div>
  );
}
