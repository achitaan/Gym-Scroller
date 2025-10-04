"use client"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { CheckCircle2, TrendingUp, MessageSquare } from "lucide-react"

interface SetSummaryScreenProps {
  onNext: () => void
}

export function SetSummaryScreen({ onNext }: SetSummaryScreenProps) {
  return (
    <div className="min-h-screen p-4 space-y-4 max-w-2xl mx-auto">
      <header className="pt-4 pb-2">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="w-8 h-8 text-success" strokeWidth={1.5} />
          <h1 className="text-3xl font-bold">Set Complete</h1>
        </div>
        <p className="text-sm text-muted-foreground mt-1">Bench Press • 185 lb</p>
      </header>

      <Card className="p-6 space-y-4 bg-card border-border">
        {/* Key Metrics */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-muted-foreground">Reps</p>
            <p className="text-4xl font-bold">8</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">TUT</p>
            <p className="text-4xl font-bold">
              32<span className="text-lg">s</span>
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Avg MCV</p>
            <p className="text-4xl font-bold">
              0.45<span className="text-lg">m/s</span>
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">%VL</p>
            <p className="text-4xl font-bold">
              18<span className="text-lg">%</span>
            </p>
          </div>
        </div>

        <div className="pt-2 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">ROM Hit Rate</span>
            <Badge className="bg-success/10 text-success border-success/20">100%</Badge>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">ROM Variability</span>
            <span className="text-sm font-medium">±2.3 cm</span>
          </div>
        </div>
      </Card>

      {/* Coaching Tip */}
      <Card className="p-4 bg-info/10 border-info/20">
        <div className="flex gap-3">
          <TrendingUp className="w-5 h-5 text-info flex-shrink-0 mt-0.5" strokeWidth={1.5} />
          <div>
            <p className="font-medium text-info-foreground">Excellent form consistency</p>
            <p className="text-sm text-muted-foreground mt-1">Your ROM stayed tight. Consider +5 lb next session.</p>
          </div>
        </div>
      </Card>

      {/* Actions */}
      <div className="space-y-3">
        <Button onClick={onNext} className="w-full bg-primary text-primary-foreground text-lg py-6">
          Log & Next Set
        </Button>
        <Button variant="outline" className="w-full justify-start gap-2 bg-transparent">
          <MessageSquare className="w-4 h-4" strokeWidth={1.5} />
          Ask Coach
        </Button>
      </div>
    </div>
  )
}
