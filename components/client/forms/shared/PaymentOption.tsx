// components/forms/shared/PaymentOption.tsx
import { Card, CardContent } from '@/components/ui/card'
import { Check } from 'lucide-react'

interface PaymentOptionProps {
  id: string
  title: string
  description: string
  icon: React.ReactNode
  selected: boolean
  onClick: () => void
}

export const PaymentOption = ({
  id,
  title,
  description,
  icon,
  selected,
  onClick,
}: PaymentOptionProps) => {
  return (
    <Card
      className={`cursor-pointer transition-all ${
        selected ? 'ring-2 ring-nch-primary bg-blue-50' : 'hover:shadow-lg'
      }`}
      onClick={onClick}
    >
      <CardContent className="flex items-center space-x-3 sm:space-x-4 p-4 sm:p-6">
        <div className="flex-shrink-0">{icon}</div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-base sm:text-lg truncate">{title}</h3>
          <p className="text-xs sm:text-sm text-gray-600 line-clamp-2">{description}</p>
        </div>
        <div className="flex-shrink-0">
          {selected && <Check className="h-4 w-4 sm:h-5 sm:w-5 text-nch-primary" />}
        </div>
      </CardContent>
    </Card>
  )
}