import React from 'react';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#FAF8F5] flex flex-col justify-center px-4 py-12">
      <div className="max-w-sm w-full mx-auto">
        {children}
      </div>
    </div>
  );
}
