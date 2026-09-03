import { useEffect, useState, useTransition } from 'react'
import { Outlet, useLocation } from '@tanstack/react-router'
import { motion } from 'framer-motion'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import Cursor from '@/components/Cursor'
import SmoothScroll from '@/components/SmoothScroll'
import Preloader from '@/components/Preloader'

/**
 * Shared shell. Navbar is fixed (72px) so the content slot carries pt-[72px];
 * full-bleed heroes opt out inside their page with -mt-[72px].
 * Page transitions: the animation key is committed inside startTransition so
 * the enter animation never blocks the router's navigation render. No exit
 * animation — unmounting the old tree during the swap causes React 19
 * removeChild errors.
 */
export default function Layout() {
  const location = useLocation()
  const [animKey, setAnimKey] = useState(location.pathname)
  const [isPending, startAnim] = useTransition()

  useEffect(() => {
    startAnim(() => setAnimKey(location.pathname))
  }, [location.pathname])

  return (
    <div className="min-h-[100dvh] bg-bg text-ink">
      <Preloader />
      <SmoothScroll />
      <Cursor />
      <Navbar />
      <main className="pt-[72px]">
        <motion.div
          key={animKey}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
          style={{ willChange: 'opacity, transform', opacity: isPending ? 0.985 : undefined }}
        >
          <Outlet />
        </motion.div>
      </main>
      <Footer />
    </div>
  )
}

