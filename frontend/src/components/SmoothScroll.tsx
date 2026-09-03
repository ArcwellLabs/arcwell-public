import { useEffect } from 'react'
import { useLocation } from '@tanstack/react-router'
import Lenis from 'lenis'
import { gsap, ScrollTrigger } from '@/lib/anim'
import { setLenis, getLenis, scrollToTarget } from '@/lib/lenis'

/**
 * Global Lenis smooth scrolling, synced with GSAP's ticker + ScrollTrigger.
 * Also owns route-change scroll restoration (top, or hash target like /#pricing).
 */
export default function SmoothScroll() {
  const location = useLocation()

  useEffect(() => {
    const lenis = new Lenis({ lerp: 0.09, wheelMultiplier: 1 })
    setLenis(lenis)
    lenis.on('scroll', ScrollTrigger.update)
    const raf = (time: number) => lenis.raf(time * 1000)
    gsap.ticker.add(raf)
    gsap.ticker.lagSmoothing(0)
    return () => {
      gsap.ticker.remove(raf)
      lenis.destroy()
      setLenis(null)
    }
  }, [])

  useEffect(() => {
    const immediate = window.setTimeout(() => {
      if (location.hash) {
        scrollToTarget(`#${location.hash.replace(/^#/, '')}`)
      } else {
        getLenis()?.scrollTo(0, { immediate: true })
      }
      ScrollTrigger.refresh()
    }, 80)
    // second refresh once media has had a chance to load and settle layout
    const settle = window.setTimeout(() => ScrollTrigger.refresh(), 900)
    return () => {
      window.clearTimeout(immediate)
      window.clearTimeout(settle)
    }
  }, [location.pathname, location.hash])

  return null
}
