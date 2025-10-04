import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Flame, Trophy, Home, Dumbbell, Radio, BarChart3, User, Target } from "lucide-react"

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="mx-auto max-w-2xl p-6">
        {/* Header */}
        <h1 className="mb-6 text-lg text-muted-foreground">Your daily strength plan</h1>

        {/* Today's Lifts Card */}
        <Card className="mb-6 border-border bg-card p-6">
          <div className="mb-4 flex items-start justify-between">
            <div>
              <h2 className="mb-2 text-2xl font-bold text-foreground">Today's Lifts</h2>
              <p className="text-sm text-muted-foreground">
                Upper Body <span className="mx-1">•</span> Strength Focus
              </p>
            </div>
            <Badge variant="outline" className="border-foreground text-foreground">
              Ready
            </Badge>
          </div>

          {/* Exercise List */}
          <div className="mb-6 space-y-3">
            <div className="flex items-center justify-between rounded-lg bg-secondary p-4">
              <div>
                <h3 className="mb-1 text-lg font-semibold text-foreground">Bench Press</h3>
                <p className="text-sm text-muted-foreground">
                  3 sets <span className="mx-1">•</span> VL 10–20%
                </p>
              </div>
              <div className="text-right">
                <span className="text-3xl font-bold text-foreground">185</span>
                <span className="text-lg text-muted-foreground">lb</span>
              </div>
            </div>

            <div className="flex items-center justify-between rounded-lg bg-secondary p-4">
              <div>
                <h3 className="mb-1 text-lg font-semibold text-foreground">Overhead Press</h3>
                <p className="text-sm text-muted-foreground">
                  3 sets <span className="mx-1">•</span> VL 10–20%
                </p>
              </div>
              <div className="text-right">
                <span className="text-3xl font-bold text-foreground">95</span>
                <span className="text-lg text-muted-foreground">lb</span>
              </div>
            </div>

            <div className="flex items-center justify-between rounded-lg bg-secondary p-4">
              <div>
                <h3 className="mb-1 text-lg font-semibold text-foreground">Barbell Row</h3>
                <p className="text-sm text-muted-foreground">
                  3 sets <span className="mx-1">•</span> VL 10–20%
                </p>
              </div>
              <div className="text-right">
                <span className="text-3xl font-bold text-foreground">155</span>
                <span className="text-lg text-muted-foreground">lb</span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90">Start Warmup</Button>
            <Button
              variant="outline"
              className="flex-1 border-foreground text-foreground hover:bg-secondary bg-transparent"
            >
              Pick Program
            </Button>
          </div>
        </Card>

        {/* Recovery Status Card */}
        <Card className="mb-6 border-border bg-card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="mb-2 text-sm text-muted-foreground">Recovery Status</p>
              <div className="flex items-baseline">
                <span className="text-5xl font-bold text-foreground">85</span>
                <span className="text-2xl text-muted-foreground">/100</span>
              </div>
            </div>
            <Target className="h-12 w-12 text-foreground" strokeWidth={1.5} />
          </div>
        </Card>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-4">
          <Card className="border-border bg-card p-6">
            <Flame className="mb-4 h-8 w-8 text-foreground" />
            <div className="text-4xl font-bold text-foreground">12</div>
            <p className="mt-1 text-sm text-muted-foreground">Day Streak</p>
          </Card>

          <Card className="border-border bg-card p-6">
            <Trophy className="mb-4 h-8 w-8 text-foreground" />
            <div className="text-4xl font-bold text-foreground">8</div>
            <p className="mt-1 text-sm text-muted-foreground">Quality PRs</p>
          </Card>
        </div>
      </div>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 border-t border-border bg-card">
        <div className="mx-auto flex max-w-2xl items-center justify-around py-3">
          <button className="flex flex-col items-center gap-1 text-foreground">
            <Home className="h-6 w-6" />
            <span className="text-xs font-medium">Today</span>
          </button>
          <button className="flex flex-col items-center gap-1 text-muted-foreground">
            <Dumbbell className="h-6 w-6" />
            <span className="text-xs">Train</span>
          </button>
          <button className="flex flex-col items-center gap-1 text-muted-foreground">
            <Radio className="h-6 w-6" />
            <span className="text-xs">Feed</span>
          </button>
          <button className="flex flex-col items-center gap-1 text-muted-foreground">
            <BarChart3 className="h-6 w-6" />
            <span className="text-xs">History</span>
          </button>
          <button className="flex flex-col items-center gap-1 text-muted-foreground">
            <User className="h-6 w-6" />
            <span className="text-xs">Profile</span>
          </button>
        </div>
      </nav>
    </div>
  )
}
