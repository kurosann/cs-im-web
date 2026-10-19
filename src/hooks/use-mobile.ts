import { useSyncExternalStore } from "react"

const MOBILE_BREAKPOINT = 768

const mediaQuery = typeof window !== "undefined" ? window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`) : null

function subscribe(onChange: () => void) {
  mediaQuery?.addEventListener("change", onChange)

  return () => mediaQuery?.removeEventListener("change", onChange)
}

function getSnapshot() {
  return mediaQuery?.matches ?? false
}

function getServerSnapshot() {
  return false
}

export function useIsMobile() {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
}
