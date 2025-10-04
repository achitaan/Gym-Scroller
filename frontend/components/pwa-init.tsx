"use client"

import { useEffect } from "react"

export function PWAInit() {
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      console.log('PWA init ready')
    }
  }, [])

  return null
}
