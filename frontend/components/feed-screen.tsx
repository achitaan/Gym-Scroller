"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { X, Zap } from "lucide-react"

const feedItems = [
  {
    id: 1,
    type: "tip",
    title: "Perfect Your Eccentric",
    content: "Control the descent for 3 seconds. This builds strength and reduces injury risk.",
    image: "/person-doing-bench-press-controlled-descent.jpg",
  },
  {
    id: 2,
    type: "insight",
    title: "Your ROM Improved 12%",
    content: "Over the last 2 weeks, your squat depth consistency has significantly improved.",
    image: "/squat-depth-form-check.jpg",
  },
  {
    id: 3,
    type: "community",
    title: "Form Check Friday",
    content: "Share your best lift this week. Tag #FormCheckFriday",
    image: "/gym-community-workout.jpg",
  },
]

export function FeedScreen() {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [repMode, setRepMode] = useState(true)

  const handleNext = () => {
    if (currentIndex < feedItems.length - 1) {
      setCurrentIndex(currentIndex + 1)
    }
  }

  const currentItem = feedItems[currentIndex]

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="fixed top-0 left-0 right-0 z-10 bg-background/80 backdrop-blur-sm border-b border-border">
        <div className="flex items-center justify-between p-4 max-w-2xl mx-auto">
          <h1 className="text-xl font-bold">Feed</h1>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setRepMode(!repMode)}
            className={repMode ? "text-success" : "text-muted-foreground"}
          >
            <Zap className="w-4 h-4 mr-1" strokeWidth={1.5} />
            {repMode ? "Rep Mode ON" : "Rep Mode OFF"}
          </Button>
        </div>
      </div>

      {/* Feed Content */}
      <div className="pt-16 pb-20">
        <div className="max-w-2xl mx-auto">
          <Card className="m-4 overflow-hidden bg-card border-border">
            <div className="relative">
              <img
                src={currentItem.image || "/placeholder.svg"}
                alt={currentItem.title}
                className="w-full aspect-[3/4] object-cover"
              />
              <Badge className="absolute top-4 left-4 bg-background/80 backdrop-blur-sm text-foreground border-border">
                {currentItem.type}
              </Badge>
            </div>
            <div className="p-6 space-y-3">
              <h2 className="text-2xl font-bold text-balance">{currentItem.title}</h2>
              <p className="text-muted-foreground leading-relaxed">{currentItem.content}</p>

              {repMode && (
                <div className="pt-4 border-t border-border">
                  <p className="text-sm text-muted-foreground flex items-center gap-2">
                    <Zap className="w-4 h-4 text-success" strokeWidth={1.5} />
                    Complete a clean rep to advance
                  </p>
                </div>
              )}
            </div>
          </Card>

          {/* Progress Indicator */}
          <div className="flex items-center justify-center gap-2 mt-4">
            {feedItems.map((_, index) => (
              <div
                key={index}
                className={`h-1 rounded-full transition-all ${
                  index === currentIndex ? "w-8 bg-primary" : index < currentIndex ? "w-4 bg-success" : "w-4 bg-muted"
                }`}
              />
            ))}
          </div>

          {/* Demo Button */}
          <div className="p-4">
            <Button onClick={handleNext} className="w-full" disabled={currentIndex === feedItems.length - 1}>
              Next Item (Demo)
            </Button>
          </div>
        </div>
      </div>

      {/* Take a Breather Prompt */}
      {currentIndex >= 2 && (
        <div className="fixed bottom-24 left-0 right-0 p-4 max-w-2xl mx-auto">
          <Card className="p-4 bg-warning/10 border-warning/20">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium">Take a breather? You've scrolled 3 items.</p>
              <Button variant="ghost" size="sm">
                <X className="w-4 h-4" strokeWidth={1.5} />
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}
