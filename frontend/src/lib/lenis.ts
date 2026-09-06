import Lenis from 'lenis'

let lenis: Lenis | null = null

export function setLenis(instance: Lenis | null) {
  lenis = instance
}

export function getLenis(): Lenis | null {
  return lenis
}

/** Smooth-scroll to a CSS selector or pixel offset, accounting for the fixed 72px nav. */
export function scrollToTarget(target: string | number) {
  if (lenis) {
    if (typeof target === 'string') {
      lenis.scrollTo(target, { offset: -72, duration: 1.4 })
    } else {
      lenis.scrollTo(target, { duration: target === 0 ? 1.2 : 1.4 })
    }
    return
  }
  if (typeof target === 'string') {
    document.querySelector(target)?.scrollIntoView({ behavior: 'smooth' })
  } else {
    window.scrollTo({ top: target, behavior: 'smooth' })
  }
}
