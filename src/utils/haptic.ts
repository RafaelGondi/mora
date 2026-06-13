type HapticPattern = number | number[]

const PATTERNS = {
  press: 6,
  lift: 10,
  drop: [8, 35, 12],
} satisfies Record<string, HapticPattern>

export function haptic(kind: keyof typeof PATTERNS) {
  if (typeof navigator === 'undefined' || !navigator.vibrate) return
  navigator.vibrate(PATTERNS[kind])
}
