"use client";

import { Card, CardContent } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatsCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: LucideIcon;
  trend?: "up" | "down" | "neutral";
  className?: string;
}

/**
 * StatsCard displays a single metric in a clean, athletic design
 * Hevy UX pattern: Data-driven cards with clear typography hierarchy and optional trend indicators
 */
export function StatsCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  className
}: StatsCardProps) {
  return (
    <Card className={cn("rounded-2xl border-neutral-200 dark:border-neutral-800", className)}>
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-neutral-500 dark:text-neutral-400">
              {title}
            </p>
            <p className="mt-2 text-3xl font-bold tracking-tight">
              {value}
            </p>
            {subtitle && (
              <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
                {subtitle}
              </p>
            )}
          </div>
          {Icon && (
            <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-950">
              <Icon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
          )}
        </div>
        {trend && (
          <div className="mt-4 flex items-center gap-1">
            <div className={cn(
              "flex items-center gap-1 text-sm font-medium",
              trend === "up" && "text-green-600 dark:text-green-400",
              trend === "down" && "text-red-600 dark:text-red-400",
              trend === "neutral" && "text-neutral-600 dark:text-neutral-400"
            )}>
              {trend === "up" && "↗"}
              {trend === "down" && "↘"}
              {trend === "neutral" && "→"}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
