// components/client/forms/shared/SectionCard.tsx
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { SectionStatus } from '@/lib/types/form'
import { Check, AlertCircle, Circle } from 'lucide-react'
import { cn } from '@/lib/utils'

interface SectionCardProps {
  title: string
  icon?: React.ReactNode
  status: SectionStatus
  children: React.ReactNode
  className?: string
}

const statusConfig = {
  complete: {
    icon: Check,
    borderColor: 'border-green-500',
    bgColor: 'bg-green-50',
    iconColor: 'text-green-600',
    badgeText: 'Complet',
    badgeBg: 'bg-green-100 text-green-700',
  },
  incomplete: {
    icon: Circle,
    borderColor: 'border-gray-300',
    bgColor: 'bg-white',
    iconColor: 'text-gray-400',
    badgeText: 'À compléter',
    badgeBg: 'bg-gray-100 text-gray-600',
  },
  error: {
    icon: AlertCircle,
    borderColor: 'border-red-500',
    bgColor: 'bg-red-50',
    iconColor: 'text-red-600',
    badgeText: 'Erreur',
    badgeBg: 'bg-red-100 text-red-700',
  },
}

export const SectionCard = ({
  title,
  icon,
  status,
  children,
  className
}: SectionCardProps) => {
  const config = statusConfig[status]
  const StatusIcon = config.icon

  return (
    <Card className={cn(
      'border-2 transition-all duration-200',
      config.borderColor,
      config.bgColor,
      className
    )}>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {icon && (
              <div className="flex-shrink-0">
                {icon}
              </div>
            )}
            <CardTitle className="text-xl font-bold text-gray-900">
              {title}
            </CardTitle>
          </div>

          {/* Status Badge */}
          <div className={cn(
            'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium',
            config.badgeBg
          )}>
            <StatusIcon className={cn('w-4 h-4', config.iconColor)} />
            <span>{config.badgeText}</span>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        {children}
      </CardContent>
    </Card>
  )
}
