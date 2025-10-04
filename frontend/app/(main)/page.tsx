"use client"

import { useState } from "react"
import { BottomNav } from "@/components/bottom-nav"
import { TodayScreen } from "@/components/today-screen"
import { TrainScreen } from "@/components/train-screen"
import { FeedScreen } from "@/components/feed-screen"
import { HistoryScreen } from "@/components/history-screen"
import { ProfileScreen } from "@/components/profile-screen"

export default function MainApp() {
  const [activeTab, setActiveTab] = useState<"today" | "train" | "feed" | "history" | "profile">("today")

  return (
    <div className="min-h-screen bg-background dark">
      <div className="pb-16">
        {activeTab === "today" && <TodayScreen />}
        {activeTab === "train" && <TrainScreen />}
        {activeTab === "feed" && <FeedScreen />}
        {activeTab === "history" && <HistoryScreen />}
        {activeTab === "profile" && <ProfileScreen />}
      </div>
      <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />
    </div>
  )
}
