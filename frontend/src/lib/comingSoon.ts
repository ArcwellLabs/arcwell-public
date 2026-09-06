import { toast } from 'sonner'

/** Shared "coming soon" feedback for placeholder social/external actions. */
export function comingSoon(label?: string) {
  toast(label ? `${label} · Coming soon` : 'Coming soon', {
    description: 'This channel is not live yet. Check back shortly.',
  })
}
