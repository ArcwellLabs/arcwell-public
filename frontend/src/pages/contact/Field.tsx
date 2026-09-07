import { useId, useState } from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

interface FieldProps {
  label: string
  value: string
  onChange: (value: string) => void
  type?: string
  required?: boolean
  error?: string
  shakeTick?: number
  textarea?: boolean
  rows?: number
  placeholder?: string
  className?: string
}

/**
 * Underline-style field: hairline bottom border, focus underline animates
 * scaleX from the left, label floats up to a mono 10px kicker.
 * On error the hairline turns #FF6B5E and the whole field shakes.
 */
export default function Field({
  label,
  value,
  onChange,
  type = 'text',
  required = false,
  error,
  shakeTick = 0,
  textarea = false,
  rows = 5,
  placeholder,
  className,
}: FieldProps) {
  const id = useId()
  const [focused, setFocused] = useState(false)
  const floated = focused || value.length > 0

  const borderColor = error ? 'border-[#FF6B5E]' : 'border-hairline'
  const underlineColor = error ? 'bg-[#FF6B5E]' : 'bg-ink'

  const sharedProps = {
    id,
    value,
    required,
    'aria-invalid': Boolean(error),
    onFocus: () => setFocused(true),
    onBlur: () => setFocused(false),
    className: cn(
      'w-full resize-none bg-transparent py-3 text-base text-ink placeholder:font-mono placeholder:text-sm focus:outline-none',
      textarea ? 'placeholder-transparent focus:placeholder:text-faint' : 'placeholder:text-faint',
    ),
  }

  return (
    <motion.div
      key={shakeTick}
      animate={error ? { x: [0, -6, 6, -4, 4, 0] } : { x: 0 }}
      transition={{ duration: 0.3 }}
      className={className}
    >
      <div className={cn('relative border-b pt-5 transition-colors duration-300', borderColor)}>
        <label
          htmlFor={id}
          className={cn(
            'pointer-events-none absolute left-0 transition-all duration-300',
            floated
              ? 'top-0 font-mono text-[10px] uppercase tracking-[0.18em] text-ink-muted'
              : 'top-[30px] text-base text-faint',
          )}
        >
          {label}
          {required && <span aria-hidden>*</span>}
        </label>
        {textarea ? (
          <textarea
            {...sharedProps}
            rows={rows}
            placeholder={placeholder}
            onChange={(e) => onChange(e.target.value)}
          />
        ) : (
          <input {...sharedProps} type={type} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} />
        )}
        <span
          aria-hidden
          className={cn(
            'absolute bottom-[-1px] left-0 h-px w-full origin-left scale-x-0 transition-transform duration-500 ease-out',
            underlineColor,
            focused && 'scale-x-100',
          )}
        />
      </div>
      {error && (
        <p role="alert" className="mt-2 font-mono text-xs tracking-[0.04em] text-[#FF6B5E]">
          {error}
        </p>
      )}
    </motion.div>
  )
}
