// components/forms/registration/StepIndicator.tsx
import { Check } from 'lucide-react'

interface StepIndicatorProps {
  currentStep: number
  steps: string[]
}

export const StepIndicator = ({ currentStep, steps }: StepIndicatorProps) => {
  return (
    <div className="flex justify-center mb-8 sm:mb-12 overflow-x-auto">
      <div className="flex items-center space-x-2 sm:space-x-4 min-w-max px-4">
        {steps.map((step, index) => (
          <div key={index} className="flex items-center">
            <div
              className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-sm sm:text-base ${
                currentStep >= index 
                  ? "bg-nch-primary text-white" 
                  : "bg-gray-200 text-gray-600"
              }`}
            >
              {currentStep > index ? (
                <Check className="h-3 w-3 sm:h-5 sm:w-5" />
              ) : (
                index + 1
              )}
            </div>
            {index < steps.length - 1 && (
              <div 
                className={`w-8 sm:w-16 h-1 ${
                  currentStep > index ? "bg-nch-primary" : "bg-gray-200"
                }`} 
              />
            )}
          </div>
        ))}
      </div>
    </div>
  )
}