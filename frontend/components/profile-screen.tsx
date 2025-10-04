import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { CheckCircle2, Circle, Settings, MessageSquare, Zap } from "lucide-react"

export function ProfileScreen() {
  return (
    <div className="min-h-screen p-4 space-y-4 max-w-2xl mx-auto bg-background">
      <header className="pt-4 pb-2">
        <h1 className="text-3xl font-bold">Profile</h1>
        <p className="text-sm text-muted-foreground mt-1">Settings & programs</p>
      </header>

      {/* Programs */}
      <Card className="p-6 space-y-4 bg-card border-border">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Training Programs</h2>
          <Button variant="ghost" size="sm">
            <Settings className="w-4 h-4" strokeWidth={1.5} />
          </Button>
        </div>

        <div className="space-y-3">
          <button className="w-full flex items-center justify-between p-4 rounded-lg bg-primary/10 border-2 border-primary text-left">
            <div>
              <p className="font-semibold">Strength</p>
              <p className="text-sm text-muted-foreground">VL 10–20% • 3-1-X-1 tempo</p>
            </div>
            <CheckCircle2 className="w-5 h-5 text-primary" strokeWidth={1.5} />
          </button>

          <button className="w-full flex items-center justify-between p-4 rounded-lg bg-secondary text-left">
            <div>
              <p className="font-semibold">Hypertrophy</p>
              <p className="text-sm text-muted-foreground">VL 20–30% • 3-0-1-0 tempo</p>
            </div>
            <Circle className="w-5 h-5 text-muted-foreground" strokeWidth={1.5} />
          </button>

          <button className="w-full flex items-center justify-between p-4 rounded-lg bg-secondary text-left">
            <div>
              <p className="font-semibold">Technique</p>
              <p className="text-sm text-muted-foreground">VL 5–10% • 4-2-1-1 tempo</p>
            </div>
            <Circle className="w-5 h-5 text-muted-foreground" strokeWidth={1.5} />
          </button>
        </div>
      </Card>

      {/* Calibration */}
      <Card className="p-6 space-y-4 bg-card border-border">
        <h2 className="text-lg font-semibold">Calibration Status</h2>

        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/50">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-success" strokeWidth={1.5} />
              <div>
                <p className="font-medium">Gold-Rep Templates</p>
                <p className="text-sm text-muted-foreground">5 lifts calibrated</p>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/50">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-success" strokeWidth={1.5} />
              <div>
                <p className="font-medium">Wrist Orientation</p>
                <p className="text-sm text-muted-foreground">Verified</p>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/50">
            <div className="flex items-center gap-3">
              <Circle className="w-5 h-5 text-muted-foreground" strokeWidth={1.5} />
              <div>
                <p className="font-medium">Sample Data Preview</p>
                <p className="text-sm text-muted-foreground">Not configured</p>
              </div>
            </div>
            <Button variant="ghost" size="sm">
              Setup
            </Button>
          </div>
        </div>
      </Card>

      {/* AI Settings */}
      <Card className="p-6 space-y-4 bg-card border-border">
        <div className="flex items-center gap-2">
          <Zap className="w-5 h-5 text-info" strokeWidth={1.5} />
          <h2 className="text-lg font-semibold">AI Assist</h2>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Auto-Progress</p>
              <p className="text-sm text-muted-foreground">Suggest load/rep increases</p>
            </div>
            <div className="w-12 h-6 bg-success rounded-full relative">
              <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full" />
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Generate Plans</p>
              <p className="text-sm text-muted-foreground">4-week training blocks</p>
            </div>
            <Button variant="outline" size="sm">
              Configure
            </Button>
          </div>
        </div>

        <Button variant="outline" className="w-full justify-start gap-2 mt-4 bg-transparent">
          <MessageSquare className="w-4 h-4" strokeWidth={1.5} />
          Coach Chat
        </Button>
      </Card>

      {/* Integrations */}
      <Card className="p-6 space-y-4 bg-card border-border">
        <h2 className="text-lg font-semibold">Integrations & Privacy</h2>

        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/50">
            <div>
              <p className="font-medium">Music Apps</p>
              <p className="text-sm text-muted-foreground">Spotify connected</p>
            </div>
            <Badge className="bg-success/10 text-success border-success/20">Connected</Badge>
          </div>

          <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/50">
            <div>
              <p className="font-medium">Health Data</p>
              <p className="text-sm text-muted-foreground">Apple Health sync</p>
            </div>
            <Badge className="bg-success/10 text-success border-success/20">Active</Badge>
          </div>

          <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/50">
            <div>
              <p className="font-medium">Data Storage</p>
              <p className="text-sm text-muted-foreground">Local-only mode</p>
            </div>
            <Button variant="ghost" size="sm">
              Change
            </Button>
          </div>
        </div>
      </Card>
    </div>
  )
}
