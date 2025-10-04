'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Dumbbell, Film, BarChart3, User } from 'lucide-react';
import { tokens } from '@/lib/design-tokens';

const tabs = [
  { id: 'today', label: 'Today', href: '/today', icon: Home },
  { id: 'train', label: 'Train', href: '/train', icon: Dumbbell },
  { id: 'feed', label: 'Feed', href: '/feed', icon: Film },
  { id: 'history', label: 'History', href: '/history', icon: BarChart3 },
  { id: 'profile', label: 'Profile', href: '/profile', icon: User },
];

export function BottomTabs() {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === '/today') {
      return pathname === '/' || pathname === '/today';
    }
    return pathname?.startsWith(href);
  };

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 border-t"
      style={{
        backgroundColor: tokens.colors.background.elevated,
        borderColor: tokens.colors.border.default,
        paddingBottom: 'env(safe-area-inset-bottom)',
      }}
    >
      <div className="flex items-center justify-around h-16 max-w-screen-lg mx-auto">
        {tabs.map((tab) => {
          const active = isActive(tab.href);
          const Icon = tab.icon;

          return (
            <Link
              key={tab.id}
              href={tab.href}
              className="flex flex-col items-center justify-center flex-1 h-full touch-manipulation"
              style={{
                minWidth: tokens.touchTarget.min,
                minHeight: tokens.touchTarget.min,
              }}
            >
              <Icon
                size={24}
                strokeWidth={active ? 2.5 : 2}
                style={{
                  color: active ? tokens.colors.accent.primary : tokens.colors.text.secondary,
                  transition: `color ${tokens.transition.fast} ease`,
                }}
              />
              <span
                className="text-xs mt-1 font-medium"
                style={{
                  color: active ? tokens.colors.accent.primary : tokens.colors.text.secondary,
                  fontSize: tokens.typography.label.size,
                  fontWeight: active ? '600' : '500',
                  transition: `color ${tokens.transition.fast} ease`,
                }}
              >
                {tab.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
