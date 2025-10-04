"use client"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ChevronDown, Music } from "lucide-react"

interface PreSetScreenProps {
  onStart: () => void
}

export function PreSetScreen({ onStart }: PreSetScreenProps) {
  return (
    <div className="min-h-screen p-4 space-y-4 max-w-2xl mx-auto">
      <header className="pt-4 pb-2">
        <h1 className="text-3xl font-bold">Train</h1>
        <p className="text-sm text-muted-foreground mt-1">Configure your set</p>
      </header>

      <Card className="p-6 space-y-6 bg-card border-border">
        {/* Lift Selection */}
        <div className="space-y-2">
          <label className="text-sm text-muted-foreground">Lift</label>
          <button className="w-full flex items-center justify-between p-4 rounded-lg bg-secondary text-left">
            <span className="font-semibold text-lg">Bench Press</span>
            <ChevronDown className="w-5 h-5 text-muted-foreground" strokeWidth={1.5} />
          </button>
        </div>

        {/* Load Target */}
        <div className="space-y-2">
          <label className="text-sm text-muted-foreground">Load Target</label>
          <div className="grid grid-cols-2 gap-3">
            <button className="p-4 rounded-lg bg-primary text-primary-foreground font-semibold">185 lb</button>
            <button className="p-4 rounded-lg bg-secondary text-foreground font-semibold">RPE 8</button>
          </div>
        </div>

        {/* VL Band */}
        <div className="space-y-2">
          <label className="text-sm text-muted-foreground">Velocity Loss Band</label>
          <div className="flex gap-2">
            <Badge className="bg-success text-success-foreground px-4 py-2 text-sm">Strength 10–20%</Badge>
            <button className="px-4 py-2 text-sm border border-border rounded-md text-muted-foreground">
              Hypertrophy 20–30%
            </button>
          </div>
        </div>

        {/* Tempo */}
        <div className="space-y-2">
          <label className="text-sm text-muted-foreground">Tempo Target</label>
          <div className="p-4 rounded-lg bg-secondary">
            <p className="text-center text-2xl font-mono font-bold">3-1-X-1</p>
            <p className="text-center text-xs text-muted-foreground mt-1">Eccentric-Pause-Concentric-Pause</p>
          </div>
        </div>

        {/* Music Mode */}
        <div className="space-y-2">
          <label className="text-sm text-muted-foreground">Music Mode</label>
          <div className="grid grid-cols-2 gap-3">
            <button className="p-4 rounded-lg bg-primary text-primary-foreground font-semibold flex items-center justify-center gap-2">
              <Music className="w-4 h-4" strokeWidth={1.5} />
              Normal
            </button>
            <button className="p-4 rounded-lg bg-secondary text-foreground font-semibold">Quiet Coaching</button>
          </div>
        </div>

        <Button onClick={onStart} className="w-full bg-success text-success-foreground text-lg py-6 mt-4">
          Start Set
        </Button>
      </Card>
    </div>
  )
}
