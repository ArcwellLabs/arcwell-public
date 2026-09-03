import { cn } from '@/lib/utils'

interface SectionKickerProps {
  index: string
  label: string
  className?: string
  align?: 'left' | 'center'
}

/** Numbered section marker: mono [index] label + 48px hairline. */
export default function SectionKicker({ index, label, className, align = 'left' }: SectionKickerProps) {
  return (
    <div className={cn('flex items-center gap-4', align === 'center' && 'justify-center', className)}>
      <span className="kicker">
        [{index}] {label}
      </span>
      <span className="h-px w-12 bg-hairline-strong" aria-hidden />
    </div>
  )
}
