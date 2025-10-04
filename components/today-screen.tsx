import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Flame, Trophy, Target, MessageSquare } from "lucide-react"

export function TodayScreen() {
  return (
    <div className="min-h-screen p-4 space-y-4 max-w-2xl mx-auto">
      <header className="pt-4 pb-2">
        <h1 className="text-3xl font-bold text-balance">Today</h1>
        <p className="text-sm text-muted-foreground mt-1">Your daily strength plan</p>
      </header>

      {/* Daily Plan Card */}
      <Card className="p-6 space-y-4 bg-card border-border">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-lg font-semibold">Today's Lifts</h2>
            <p className="text-sm text-muted-foreground mt-1">Upper Body • Strength Focus</p>
          </div>
          <Badge variant="outline" className="bg-success/10 text-success border-success/20">
            Ready
          </Badge>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/50">
            <div>
              <p className="font-medium">Bench Press</p>
              <p className="text-sm text-muted-foreground">3 sets • VL 10–20%</p>
            </div>
            <span className="text-2xl font-bold text-muted-foreground">
              185<span className="text-sm">lb</span>
            </span>
          </div>

          <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/50">
            <div>
              <p className="font-medium">Overhead Press</p>
              <p className="text-sm text-muted-foreground">3 sets • VL 10–20%</p>
            </div>
            <span className="text-2xl font-bold text-muted-foreground">
              95<span className="text-sm">lb</span>
            </span>
          </div>

          <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/50">
            <div>
              <p className="font-medium">Barbell Row</p>
              <p className="text-sm text-muted-foreground">3 sets • VL 10–20%</p>
            </div>
            <span className="text-2xl font-bold text-muted-foreground">
              155<span className="text-sm">lb</span>
            </span>
          </div>
        </div>

        <div className="flex gap-2 pt-2">
          <Button className="flex-1 bg-primary text-primary-foreground">Start Warmup</Button>
          <Button variant="outline" className="flex-1 bg-transparent">
            Pick Program
          </Button>
        </div>
      </Card>

      {/* Recovery Tile */}
      <Card className="p-4 bg-card border-border">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">Recovery Status</p>
            <p className="text-2xl font-bold mt-1">
              85<span className="text-sm text-muted-foreground">/100</span>
            </p>
          </div>
          <div className="w-16 h-16 rounded-full bg-success/20 flex items-center justify-center">
            <Target className="w-8 h-8 text-success" strokeWidth={1.5} />
          </div>
        </div>
      </Card>

      {/* Streaks & Achievements */}
      <div className="flex gap-3">
        <Card className="flex-1 p-4 bg-card border-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-warning/20 flex items-center justify-center">
              <Flame className="w-5 h-5 text-warning" strokeWidth={1.5} />
            </div>
            <div>
              <p className="text-2xl font-bold">12</p>
              <p className="text-xs text-muted-foreground">Day Streak</p>
            </div>
          </div>
        </Card>

        <Card className="flex-1 p-4 bg-card border-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-info/20 flex items-center justify-center">
              <Trophy className="w-5 h-5 text-info" strokeWidth={1.5} />
            </div>
            <div>
              <p className="text-2xl font-bold">8</p>
              <p className="text-xs text-muted-foreground">Quality PRs</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Coach Chat */}
      <Button variant="outline" className="w-full justify-start gap-2 bg-transparent">
        <MessageSquare className="w-4 h-4" strokeWidth={1.5} />
        Coach Chat
      </Button>
    </div>
  )
}
