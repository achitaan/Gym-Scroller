"use client"

import { useState } from "react"
import { PreSetScreen } from "@/components/train/pre-set-screen"
import { LiveSetScreen } from "@/components/train/live-set-screen"
import { SetSummaryScreen } from "@/components/train/set-summary-screen"

export function TrainScreen() {
  const [stage, setStage] = useState<"pre-set" | "live-set" | "summary">("pre-set")

  return (
    <>
      {stage === "pre-set" && <PreSetScreen onStart={() => setStage("live-set")} />}
      {stage === "live-set" && <LiveSetScreen onComplete={() => setStage("summary")} />}
      {stage === "summary" && <SetSummaryScreen onNext={() => setStage("pre-set")} />}
    </>
  )
}
