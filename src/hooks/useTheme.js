/**
 * @file useTheme.js
 * @description Applies theme (light/dark/system) to <html> class and persists choice.
 */

import { useEffect } from 'react'
import { useStore } from '../store.js'

export function useTheme() {
  const theme = useStore((s) => s.theme)
  useEffect(() => {
    const root = document.documentElement
    const apply = (dark) => {
      root.classList.toggle('dark', dark)
    }
    if (theme === 'dark') {
      apply(true)
      return
    }
    if (theme === 'light') {
      apply(false)
      return
    }
    // system
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    apply(mq.matches)
    const handler = (e) => apply(e.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [theme])
}
