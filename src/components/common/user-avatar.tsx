'use client';

import React, { useState } from 'react';
import Image from 'next/image';

interface UserAvatarProps {
  name: string;
  avatarUrl?: string | null;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export function UserAvatar({
  name,
  avatarUrl,
  size = 'md',
  className = '',
}: UserAvatarProps) {
  const [imageError, setImageError] = useState(false);

  const sizeClasses = {
    xs: 'w-5 h-5 text-[10px]',
    sm: 'w-7 h-7 text-xs',
    md: 'w-9 h-9 text-sm',
    lg: 'w-12 h-12 text-base',
    xl: 'w-16 h-16 text-xl',
  };

  const initial = (name?.trim()?.charAt(0) || 'U').toUpperCase();

  if (avatarUrl && !imageError) {
    return (
      <div className={`relative rounded-full overflow-hidden shrink-0 border border-stone-200/80 ${sizeClasses[size]} ${className}`}>
        <Image
          src={avatarUrl}
          alt={name}
          fill
          sizes="(max-width: 768px) 48px, 64px"
          className="object-cover"
          onError={() => setImageError(true)}
        />
      </div>
    );
  }

  return (
    <div
      className={`rounded-full bg-[#ECF5F0] text-[#26593F] font-bold flex items-center justify-center shrink-0 border border-[#26593F]/15 select-none ${sizeClasses[size]} ${className}`}
    >
      {initial}
    </div>
  );
}
