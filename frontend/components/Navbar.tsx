"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, History, User } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Navbar is the bottom navigation bar
 * Hevy UX pattern: Bottom navigation for quick access to main sections (Home, History, Profile)
 * Sticky positioning keeps navigation always accessible, matching Hevy's mobile-first approach
 */
export function Navbar() {
  const pathname = usePathname();

  const navItems = [
    {
      href: "/",
      icon: Home,
      label: "Home",
    },
    {
      href: "/history",
      icon: History,
      label: "History",
    },
    {
      href: "/profile",
      icon: User,
      label: "Profile",
    },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-950">
      <div className="flex items-center justify-around h-16 max-w-lg mx-auto">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center gap-1 px-6 py-2 transition-colors",
                isActive
                  ? "text-blue-600 dark:text-blue-400"
                  : "text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100"
              )}
            >
              <Icon className="h-6 w-6" />
              <span className="text-xs font-medium">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
