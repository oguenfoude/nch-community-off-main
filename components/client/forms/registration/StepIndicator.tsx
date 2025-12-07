// components/client/forms/registration/StepIndicator.tsx
"use client"

import React from "react"
import { CheckCircle2 } from "lucide-react"

interface StepIndicatorProps {
  currentStep: number
  steps: string[]
  className?: string
}

export const StepIndicator = ({
  currentStep,
  steps,
  className = "",
}: StepIndicatorProps) => {
  const progressPercentage = ((currentStep - 1) / (steps.length - 1)) * 100

  return (
    <div className={`w-full mb-6 sm:mb-8 ${className}`}>
      {/* Progress Bar */}
      <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden mb-6">
        <div
          className="bg-gradient-to-r from-nch-primary to-orange-500 h-full transition-all duration-300"
          style={{ width: `${progressPercentage}%` }}
        />
      </div>

      {/* Steps Timeline */}
      <div className="flex justify-center mb-8 sm:mb-12 overflow-x-auto">
        <div className="flex items-center gap-2 sm:gap-4 min-w-max px-4 relative">
          {/* Connector Line Behind */}
          <div className="absolute top-5 left-0 right-0 h-0.5 bg-gray-300 -z-10" />

          {steps.map((step, index) => {
            const stepNumber = index + 1
            const isCompleted = stepNumber < currentStep
            const isCurrent = stepNumber === currentStep
            const isPending = stepNumber > currentStep

            return (
              <div key={index} className="flex flex-col items-center">
                {/* Step Circle */}
                <div
                  className={`
                    w-9 h-9 sm:w-11 sm:h-11 rounded-full flex items-center justify-center 
                    font-bold text-xs sm:text-sm
                    transition-all duration-300 transform relative z-10
                    ${
                      isCompleted
                        ? "bg-green-500 text-white shadow-md scale-100"
                        : isCurrent
                          ? "bg-nch-primary text-white scale-110 shadow-lg ring-4 ring-nch-primary ring-opacity-30"
                          : "bg-gray-300 text-gray-600"
                    }
                  `}
                >
                  {isCompleted ? (
                    <CheckCircle2 className="w-5 h-5" />
                  ) : (
                    stepNumber
                  )}
                </div>

                {/* Step Label */}
                <div className="text-center mt-3 max-w-24">
                  <p
                    className={`text-xs font-medium transition-colors truncate
                    ${
                      isCurrent
                        ? "text-nch-primary font-bold"
                        : isCompleted
                          ? "text-green-600"
                          : "text-gray-500"
                    }
                  `}
                  >
                    {step}
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Step Description Box */}
      <div className="p-4 bg-blue-50 border-l-4 border-blue-500 rounded-r-lg">
        <p className="text-sm font-semibold text-blue-900">
          {getStepDescription(currentStep, steps.length)}
        </p>
      </div>
    </div>
  )
}

// ============================================
// HELPER - Step Descriptions
// ============================================

function getStepDescription(currentStep: number, totalSteps: number): string {
  switch (currentStep) {
    case 1:
      return "📋 Commençons par vos informations personnelles de base"
    case 2:
      return "📄 Téléchargez vos documents requis (ID, diplôme, photo)"
    case 3:
      return "🌍 Choisissez votre offre et vos pays d'intérêt"
    case 4:
      return "💳 Complétez le paiement pour finaliser votre inscription"
    default:
      return `Étape ${currentStep} de ${totalSteps}`
  }
}