import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { TrendingUp, Award, Calendar } from "lucide-react"

export function HistoryScreen() {
  return (
    <div className="min-h-screen p-4 space-y-4 max-w-2xl mx-auto bg-background">
      <header className="pt-4 pb-2">
        <h1 className="text-3xl font-bold">History</h1>
        <p className="text-sm text-muted-foreground mt-1">Track your progress</p>
      </header>

      {/* Filters */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        <Badge className="bg-primary text-primary-foreground px-4 py-2 whitespace-nowrap">All Lifts</Badge>
        <Badge variant="outline" className="px-4 py-2 whitespace-nowrap">
          This Week
        </Badge>
        <Badge variant="outline" className="px-4 py-2 whitespace-nowrap">
          Strength Program
        </Badge>
      </div>

      {/* Lift Dashboard */}
      <Card className="p-6 space-y-4 bg-card border-border">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-xl font-semibold">Bench Press</h2>
            <p className="text-sm text-muted-foreground mt-1">Last 4 weeks</p>
          </div>
          <Badge className="bg-success/10 text-success border-success/20">
            <TrendingUp className="w-3 h-3 mr-1" strokeWidth={1.5} />
            +8%
          </Badge>
        </div>

        {/* VL Distribution */}
        <div className="space-y-2">
          <p className="text-sm font-medium">Velocity Loss Distribution</p>
          <div className="flex items-end gap-1 h-24">
            {[12, 18, 25, 32, 28, 22, 15, 8].map((height, i) => (
              <div key={i} className="flex-1 flex flex-col justify-end">
                <div
                  className={`w-full rounded-t ${i < 2 ? "bg-success" : i < 5 ? "bg-warning" : "bg-destructive"}`}
                  style={{ height: `${height * 3}px` }}
                />
              </div>
            ))}
          </div>
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>0%</span>
            <span>10%</span>
            <span>20%</span>
            <span>30%</span>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-2 gap-4 pt-2">
          <div>
            <p className="text-sm text-muted-foreground">Avg MCV @ 185lb</p>
            <p className="text-2xl font-bold">
              0.48<span className="text-sm">m/s</span>
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">ROM Hit Rate</p>
            <p className="text-2xl font-bold">
              96<span className="text-sm">%</span>
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Avg TUT</p>
            <p className="text-2xl font-bold">
              34<span className="text-sm">s</span>
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Sessions</p>
            <p className="text-2xl font-bold">12</p>
          </div>
        </div>
      </Card>

      {/* Quality PRs */}
      <Card className="p-6 space-y-4 bg-card border-border">
        <div className="flex items-center gap-2">
          <Award className="w-5 h-5 text-info" strokeWidth={1.5} />
          <h2 className="text-lg font-semibold">Quality PRs</h2>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/50">
            <div>
              <p className="font-medium">Best Form @ 185lb</p>
              <p className="text-sm text-muted-foreground">ROM 100% • VL 15%</p>
            </div>
            <Badge className="bg-info/10 text-info border-info/20">
              <Calendar className="w-3 h-3 mr-1" strokeWidth={1.5} />
              2d ago
            </Badge>
          </div>

          <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/50">
            <div>
              <p className="font-medium">Highest MCV</p>
              <p className="text-sm text-muted-foreground">0.52 m/s @ 175lb</p>
            </div>
            <Badge className="bg-info/10 text-info border-info/20">
              <Calendar className="w-3 h-3 mr-1" strokeWidth={1.5} />
              1w ago
            </Badge>
          </div>
        </div>
      </Card>

      {/* Session Timeline */}
      <Card className="p-6 space-y-4 bg-card border-border">
        <h2 className="text-lg font-semibold">Recent Sessions</h2>

        <div className="space-y-3">
          {[
            { date: "Today", lifts: "Bench, OHP, Row", sets: 9 },
            { date: "Yesterday", lifts: "Squat, RDL, Leg Press", sets: 12 },
            { date: "2 days ago", lifts: "Bench, OHP, Row", sets: 9 },
          ].map((session, i) => (
            <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-secondary/50">
              <div>
                <p className="font-medium">{session.date}</p>
                <p className="text-sm text-muted-foreground">{session.lifts}</p>
              </div>
              <span className="text-sm text-muted-foreground">{session.sets} sets</span>
            </div>
          ))}
        </div>
      </Card>

      <Button variant="outline" className="w-full bg-transparent">
        Export Data
      </Button>
    </div>
  )
}
