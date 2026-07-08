import { cn } from '@/lib/utils'

export function Badge({
  className,
  variant = 'default',
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & {
  variant?: 'default' | 'destructive' | 'outline' | 'secondary'
}) {
  const variants: Record<string, string> = {
    default: 'bg-primary text-primary-foreground',
    destructive: 'bg-destructive text-destructive-foreground',
    outline: 'border text-foreground',
    secondary: 'bg-secondary text-secondary-foreground',
  }

  return (
    <div
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors',
        variants[variant],
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}
