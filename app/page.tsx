"use client"

import { useState } from "react"
import { TodayScreen } from "@/components/today-screen"
import { TrainScreen } from "@/components/train-screen"
import { FeedScreen } from "@/components/feed-screen"
import { HistoryScreen } from "@/components/history-screen"
import { ProfileScreen } from "@/components/profile-screen"
import { BottomNav } from "@/components/bottom-nav"

export default function FitnessApp() {
  const [activeTab, setActiveTab] = useState<"today" | "train" | "feed" | "history" | "profile">("today")

  return (
    <div className="dark min-h-screen bg-background pb-20">
      {activeTab === "today" && <TodayScreen />}
      {activeTab === "train" && <TrainScreen />}
      {activeTab === "feed" && <FeedScreen />}
      {activeTab === "history" && <HistoryScreen />}
      {activeTab === "profile" && <ProfileScreen />}

      <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />
    </div>
  )
}
