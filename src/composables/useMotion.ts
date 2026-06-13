import { ref, onMounted } from 'vue'

export function usePrefersReducedMotion() {
  const reduced = ref(false)

  onMounted(() => {
    reduced.value = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  })

  return reduced
}

export function useCountUp(target: () => number, duration = 700) {
  const display = ref(0)
  let frame = 0

  function animate() {
    const goal = target()
    if (goal === 0) {
      display.value = 0
      return
    }

    const start = performance.now()
    const from = display.value

    function tick(now: number) {
      const progress = Math.min((now - start) / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      display.value = Math.round(from + (goal - from) * eased)
      if (progress < 1) frame = requestAnimationFrame(tick)
    }

    cancelAnimationFrame(frame)
    frame = requestAnimationFrame(tick)
  }

  return { display, animate }
}

const ROUTE_ORDER: Record<string, number> = {
  '/': 0,
  '/backlog': 1,
  '/search': 2,
  '/settings': 3,
}

export function pageTransitionName(from: string, to: string) {
  const a = ROUTE_ORDER[from] ?? 3
  const b = ROUTE_ORDER[to] ?? 3
  if (a === b) return 'page-fade'
  return b > a ? 'page-slide-left' : 'page-slide-right'
}
