import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Flame, Trophy } from "lucide-react"

export function TodayScreen() {
  return (
    <div className="min-h-screen p-6 space-y-6 max-w-2xl mx-auto pb-24">
      <header className="pt-2">
        <p className="text-muted-foreground text-sm">Your daily strength plan</p>
      </header>

      {/* Daily Plan Card */}
      <Card className="p-6 space-y-5 bg-card/50 border border-border/50 rounded-2xl">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-xl font-bold">Today's Lifts</h2>
            <p className="text-sm text-muted-foreground mt-1">Upper Body • Strength Focus</p>
          </div>
          <Badge variant="outline" className="bg-transparent text-foreground border-foreground/30 rounded-full px-3">
            Ready
          </Badge>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between p-4 rounded-xl bg-secondary/30">
            <div>
              <p className="font-semibold text-base">Bench Press</p>
              <p className="text-sm text-muted-foreground mt-0.5">3 sets • VL 10–20%</p>
            </div>
            <span className="text-4xl font-bold tabular-nums">
              185<span className="text-base font-normal text-muted-foreground">lb</span>
            </span>
          </div>

          <div className="flex items-center justify-between p-4 rounded-xl bg-secondary/30">
            <div>
              <p className="font-semibold text-base">Overhead Press</p>
              <p className="text-sm text-muted-foreground mt-0.5">3 sets • VL 10–20%</p>
            </div>
            <span className="text-4xl font-bold tabular-nums">
              95<span className="text-base font-normal text-muted-foreground">lb</span>
            </span>
          </div>

          <div className="flex items-center justify-between p-4 rounded-xl bg-secondary/30">
            <div>
              <p className="font-semibold text-base">Barbell Row</p>
              <p className="text-sm text-muted-foreground mt-0.5">3 sets • VL 10–20%</p>
            </div>
            <span className="text-4xl font-bold tabular-nums">
              155<span className="text-base font-normal text-muted-foreground">lb</span>
            </span>
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <Button className="flex-1 bg-foreground text-background hover:bg-foreground/90 rounded-xl h-12 font-medium">
            Start Warmup
          </Button>
          <Button
            variant="outline"
            className="flex-1 bg-transparent border-foreground/30 hover:bg-foreground/5 rounded-xl h-12 font-medium"
          >
            Pick Program
          </Button>
        </div>
      </Card>

      {/* Recovery Tile */}
      <Card className="p-5 bg-card/50 border border-border/50 rounded-2xl">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">Recovery Status</p>
            <p className="text-4xl font-bold mt-1 tabular-nums">
              85<span className="text-lg text-muted-foreground font-normal">/100</span>
            </p>
          </div>
          <div className="w-14 h-14 rounded-full border-2 border-foreground/20 flex items-center justify-center relative">
            <div className="w-8 h-8 rounded-full border-2 border-foreground/40 flex items-center justify-center">
              <div className="w-3 h-3 rounded-full bg-foreground"></div>
            </div>
          </div>
        </div>
      </Card>

      {/* Streaks & Achievements */}
      <div className="flex gap-3">
        <Card className="flex-1 p-5 bg-card/50 border border-border/50 rounded-2xl">
          <div className="flex items-center gap-3">
            <Flame className="w-6 h-6 text-foreground" strokeWidth={1.5} />
            <div>
              <p className="text-3xl font-bold tabular-nums">12</p>
              <p className="text-xs text-muted-foreground mt-0.5">Day Streak</p>
            </div>
          </div>
        </Card>

        <Card className="flex-1 p-5 bg-card/50 border border-border/50 rounded-2xl">
          <div className="flex items-center gap-3">
            <Trophy className="w-6 h-6 text-foreground" strokeWidth={1.5} />
            <div>
              <p className="text-3xl font-bold tabular-nums">8</p>
              <p className="text-xs text-muted-foreground mt-0.5">Quality PRs</p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}
