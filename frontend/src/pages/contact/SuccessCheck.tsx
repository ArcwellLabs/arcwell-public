import { motion } from 'framer-motion'

/** Accent check circle with draw-on stroke animation (0.6s). */
export default function SuccessCheck() {
  return (
    <motion.svg
      viewBox="0 0 64 64"
      className="h-16 w-16"
      role="img"
      aria-label="Success"
      initial="hidden"
      animate="visible"
    >
      <motion.circle
        cx="32"
        cy="32"
        r="29"
        fill="none"
        stroke="#E8E8E4"
        strokeWidth="2"
        variants={{ hidden: { pathLength: 0 }, visible: { pathLength: 1 } }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
      />
      <motion.path
        d="M20 33 L28.5 41.5 L44 24"
        fill="none"
        stroke="#E8E8E4"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
        variants={{ hidden: { pathLength: 0 }, visible: { pathLength: 1 } }}
        transition={{ duration: 0.45, ease: 'easeOut', delay: 0.45 }}
      />
    </motion.svg>
  )
}
