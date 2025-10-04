"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CheckCircle2, Circle } from "lucide-react"

interface LiveSetScreenProps {
  onComplete: () => void
}

export function LiveSetScreen({ onComplete }: LiveSetScreenProps) {
  const [reps, setReps] = useState(0)
  const [tut, setTut] = useState(0)
  const [vlStatus, setVlStatus] = useState<"green" | "amber" | "red">("green")

  useEffect(() => {
    const timer = setInterval(() => {
      setTut((prev) => prev + 1)
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  const handleRep = () => {
    setReps((prev) => prev + 1)
    if (reps >= 5) setVlStatus("amber")
    if (reps >= 7) setVlStatus("red")
  }

  const vlColors = {
    green: "bg-success",
    amber: "bg-warning",
    red: "bg-destructive",
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 max-w-2xl mx-auto">
      <div className="w-full space-y-8">
        {/* VL Status Bar */}
        <div className="w-full h-2 bg-secondary rounded-full overflow-hidden">
          <div
            className={`h-full transition-all duration-300 ${vlColors[vlStatus]}`}
            style={{ width: `${Math.min((reps / 10) * 100, 100)}%` }}
          />
        </div>

        {/* Rep Counter */}
        <div className="text-center">
          <p className="text-sm text-muted-foreground mb-2">Reps</p>
          <p className="text-9xl font-bold tabular-nums">{reps}</p>
        </div>

        {/* Metrics Row */}
        <div className="grid grid-cols-3 gap-4">
          <Card className="p-4 bg-card border-border text-center">
            <p className="text-xs text-muted-foreground mb-1">TUT</p>
            <p className="text-2xl font-bold tabular-nums">{tut}s</p>
          </Card>

          <Card className="p-4 bg-card border-border text-center">
            <p className="text-xs text-muted-foreground mb-1">Est. RIR</p>
            <p className="text-2xl font-bold">2-3</p>
          </Card>

          <Card className="p-4 bg-card border-border text-center">
            <p className="text-xs text-muted-foreground mb-1">ROM Hit</p>
            <div className="flex items-center justify-center gap-1 mt-1">
              <CheckCircle2 className="w-5 h-5 text-success" strokeWidth={1.5} />
              <span className="text-lg font-bold">{reps > 0 ? "100%" : "—"}</span>
            </div>
          </Card>
        </div>

        {/* VL Band Indicator */}
        <div className="flex items-center justify-center gap-2">
          <Circle className={`w-3 h-3 fill-current ${vlStatus === "green" ? "text-success" : "text-muted"}`} />
          <Circle className={`w-3 h-3 fill-current ${vlStatus === "amber" ? "text-warning" : "text-muted"}`} />
          <Circle className={`w-3 h-3 fill-current ${vlStatus === "red" ? "text-destructive" : "text-muted"}`} />
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <Button onClick={handleRep} className="flex-1 bg-primary text-primary-foreground text-lg py-6">
            Rep Complete
          </Button>
          <Button onClick={onComplete} variant="outline" className="flex-1 text-lg py-6 bg-transparent">
            End Set
          </Button>
        </div>
      </div>
    </div>
  )
}
