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
        <div className="flex items-center gap-3 sm:gap-6 min-w-max px-4">
          {steps.map((step, index) => {
            const stepNumber = index + 1
            const isCompleted = stepNumber < currentStep
            const isCurrent = stepNumber === currentStep
            const isPending = stepNumber > currentStep

            return (
              <React.Fragment key={index}>
                <div className="flex flex-col items-center">
                  {/* Step Circle */}
                  <div
                    className={`
                      w-12 h-12 sm:w-14 sm:h-14 rounded-full flex items-center justify-center 
                      font-bold text-base sm:text-lg
                      transition-all duration-300 transform
                      ${
                        isCompleted
                          ? "bg-green-500 text-white shadow-lg scale-105"
                          : isCurrent
                            ? "bg-nch-primary text-white scale-110 shadow-xl ring-4 ring-nch-primary ring-opacity-40 animate-pulse"
                            : "bg-gray-300 text-gray-600"
                      }
                    `}
                  >
                    {isCompleted ? (
                      <CheckCircle2 className="w-6 h-6 sm:w-7 sm:h-7" />
                    ) : (
                      stepNumber
                    )}
                  </div>

                  {/* Step Label */}
                  <div className="text-center mt-3 max-w-28">
                    <p
                      className={`text-xs sm:text-sm font-semibold transition-colors
                      ${
                        isCurrent
                          ? "text-nch-primary font-bold"
                          : isCompleted
                            ? "text-green-600 font-medium"
                            : "text-gray-500"
                      }
                    `}
                    >
                      {step}
                    </p>
                  </div>
                </div>

                {/* Connector Line Between Steps */}
                {index < steps.length - 1 && (
                  <div className="flex items-center mb-12">
                    <div
                      className={`h-1 w-8 sm:w-12 transition-all duration-300
                        ${stepNumber < currentStep ? "bg-green-500" : "bg-gray-300"}
                      `}
                    />
                  </div>
                )}
              </React.Fragment>
            )
          })}
        </div>
      </div>

      {/* Step Description Box */}
      <div className="p-5 bg-gradient-to-r from-blue-50 to-indigo-50 border-l-4 border-nch-primary rounded-r-lg shadow-sm">
        <div className="flex items-center gap-3">
          <div className="flex-shrink-0 w-10 h-10 bg-nch-primary text-white rounded-full flex items-center justify-center font-bold text-lg">
            {currentStep}
          </div>
          <p className="text-sm sm:text-base font-semibold text-gray-800">
            {getStepDescription(currentStep, steps.length)}
          </p>
        </div>
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