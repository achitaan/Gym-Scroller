"use client"

import { Home, Dumbbell, Rss, BarChart3, User } from "lucide-react"

interface BottomNavProps {
  activeTab: "today" | "train" | "feed" | "history" | "profile"
  onTabChange: (tab: "today" | "train" | "feed" | "history" | "profile") => void
}

export function BottomNav({ activeTab, onTabChange }: BottomNavProps) {
  const tabs = [
    { id: "today" as const, label: "Home", icon: Home },
    { id: "train" as const, label: "Train", icon: Dumbbell },
    { id: "feed" as const, label: "Feed", icon: Rss },
    { id: "history" as const, label: "History", icon: BarChart3 },
    { id: "profile" as const, label: "Profile", icon: User },
  ]

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-card border-t border-border">
      <div className="flex items-center justify-around h-16 max-w-2xl mx-auto">
        {tabs.map((tab) => {
          const Icon = tab.icon
          const isActive = activeTab === tab.id
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`flex flex-col items-center justify-center gap-1 px-4 py-2 transition-colors ${
                isActive ? "text-primary" : "text-muted-foreground"
              }`}
            >
              <Icon className="w-5 h-5" strokeWidth={1.5} />
              <span className="text-xs font-medium">{tab.label}</span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}
