'use client'

import { ButtonHTMLAttributes, forwardRef, ReactNode } from 'react'
import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'success' | 'gradient' | 'gradient-accent' | 'outline' | 'outline-gradient'
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  isLoading?: boolean
  loadingText?: string
  leftIcon?: ReactNode
  rightIcon?: ReactNode
  fullWidth?: boolean
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      children,
      className,
      variant = 'primary',
      size = 'md',
      isLoading = false,
      loadingText,
      leftIcon,
      rightIcon,
      fullWidth = false,
      disabled,
      ...props
    },
    ref
  ) => {
    const baseStyles = 'inline-flex items-center justify-center font-semibold rounded-[var(--radius)] transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50'

    const variantStyles = {
      // Premium Primary - Gradient with glow
      primary: 'bg-gradient-to-r from-[#6366F1] to-[#8B5CF6] text-white shadow-[0_1px_2px_rgba(0,0,0,0.1),0_4px_12px_rgba(99,102,241,0.25),inset_0_1px_0_rgba(255,255,255,0.15)] hover:shadow-[0_2px_4px_rgba(0,0,0,0.1),0_8px_20px_rgba(99,102,241,0.35),inset_0_1px_0_rgba(255,255,255,0.2)] hover:-translate-y-0.5 active:translate-y-0 focus-visible:ring-[#6366F1]',

      // Premium Secondary - Clean with hover accent
      secondary: 'bg-white border border-[var(--border-strong)] text-[var(--foreground)] shadow-[0_1px_2px_rgba(0,0,0,0.03)] hover:border-[var(--primary)] hover:text-[var(--primary)] hover:shadow-[var(--shadow-sm)] focus-visible:ring-[var(--primary)]',

      // Ghost - Subtle
      ghost: 'text-[var(--foreground-muted)] hover:bg-[var(--surface-hover)] hover:text-[var(--foreground)]',

      // Premium Danger - Gradient red
      danger: 'bg-gradient-to-r from-[#EF4444] to-[#F87171] text-white shadow-[0_1px_2px_rgba(0,0,0,0.1),0_4px_12px_rgba(239,68,68,0.25)] hover:shadow-[0_2px_4px_rgba(0,0,0,0.1),0_8px_20px_rgba(239,68,68,0.35)] hover:-translate-y-0.5 active:translate-y-0 focus-visible:ring-[#EF4444]',

      // Premium Success - Gradient green
      success: 'bg-gradient-to-r from-[#22C55E] to-[#10B981] text-white shadow-[0_1px_2px_rgba(0,0,0,0.1),0_4px_12px_rgba(34,197,94,0.25)] hover:shadow-[0_2px_4px_rgba(0,0,0,0.1),0_8px_20px_rgba(34,197,94,0.35)] hover:-translate-y-0.5 active:translate-y-0 focus-visible:ring-[#22C55E]',

      gradient: 'btn-gradient',
      'gradient-accent': 'btn-gradient-accent',
      outline: 'bg-transparent border-2 border-[var(--primary)] text-[var(--primary)] hover:bg-[var(--primary-light)] focus-visible:ring-[var(--primary)]',
      'outline-gradient': 'btn-outline-gradient',
    }

    const sizeStyles = {
      xs: 'h-7 px-2.5 text-xs gap-1',
      sm: 'h-8 px-3 text-sm gap-1.5',
      md: 'h-10 px-4 text-sm gap-2',
      lg: 'h-12 px-6 text-base gap-2.5',
      xl: 'h-14 px-8 text-lg gap-3',
    }

    return (
      <button
        ref={ref}
        className={cn(
          baseStyles,
          variantStyles[variant],
          sizeStyles[size],
          fullWidth && 'w-full',
          isLoading && 'cursor-wait',
          className
        )}
        disabled={isLoading || disabled}
        {...props}
      >
        {isLoading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            {loadingText || children}
          </>
        ) : (
          <>
            {leftIcon && <span className="flex-shrink-0">{leftIcon}</span>}
            {children}
            {rightIcon && <span className="flex-shrink-0">{rightIcon}</span>}
          </>
        )}
      </button>
    )
  }
)

Button.displayName = 'Button'

// Icon Button Variant
interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  isLoading?: boolean
  'aria-label': string
}

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ children, className, variant = 'ghost', size = 'md', isLoading = false, disabled, ...props }, ref) => {
    const baseStyles = 'inline-flex items-center justify-center rounded-lg transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50'

    const variantStyles = {
      primary: 'bg-[var(--primary)] text-white hover:bg-[var(--primary-hover)] focus-visible:ring-[var(--primary)]',
      secondary: 'bg-white border border-[var(--border)] text-[var(--foreground-muted)] hover:bg-[var(--surface-hover)] hover:text-[var(--foreground)]',
      ghost: 'text-[var(--foreground-muted)] hover:bg-[var(--surface-hover)] hover:text-[var(--foreground)]',
      danger: 'text-red-600 hover:bg-red-50',
    }

    const sizeStyles = {
      sm: 'h-8 w-8',
      md: 'h-10 w-10',
      lg: 'h-12 w-12',
    }

    return (
      <button
        ref={ref}
        className={cn(baseStyles, variantStyles[variant], sizeStyles[size], className)}
        disabled={isLoading || disabled}
        {...props}
      >
        {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : children}
      </button>
    )
  }
)

IconButton.displayName = 'IconButton'

// Button Group
interface ButtonGroupProps {
  children: ReactNode
  className?: string
}

export function ButtonGroup({ children, className }: Readonly<ButtonGroupProps>) {
  return (
    <div className={cn('inline-flex rounded-xl overflow-hidden border border-[var(--border)] divide-x divide-[var(--border)]', className)}>
      {children}
    </div>
  )
}

export function ButtonGroupItem({
  children,
  className,
  isActive = false,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { isActive?: boolean }) {
  return (
    <button
      className={cn(
        'px-4 py-2 text-sm font-medium transition-colors',
        isActive
          ? 'bg-[var(--primary)] text-white'
          : 'bg-white text-[var(--foreground-muted)] hover:bg-[var(--surface-hover)] hover:text-[var(--foreground)]',
        className
      )}
      {...props}
    >
      {children}
    </button>
  )
}

export default Button
