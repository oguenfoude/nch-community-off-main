// components/client/forms/registration/StepIndicator.tsx
"use client"

import React from "react"
import { FileText, FolderOpen, Globe, CreditCard, CheckCircle } from "lucide-react"

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
  const stepIcons = [
    { icon: FileText, color: "text-blue-600" },
    { icon: FolderOpen, color: "text-purple-600" },
    { icon: Globe, color: "text-green-600" },
    { icon: CreditCard, color: "text-orange-600" }
  ]

  return (
    <div className={`w-full mb-6 sm:mb-8 ${className}`}>
      {/* Steps */}
      <div className="grid grid-cols-4 gap-2 sm:gap-4 mb-6">
        {steps.map((step, index) => {
          const stepNumber = index + 1
          const isCompleted = stepNumber < currentStep
          const isCurrent = stepNumber === currentStep
          const IconComponent = stepIcons[index].icon
          const iconColor = stepIcons[index].color

          return (
            <div key={index} className="flex flex-col items-center">
              {/* Step Circle with Icon */}
              <div
                className={`
                  w-12 h-12 sm:w-16 sm:h-16 rounded-full flex items-center justify-center 
                  transition-all duration-300 mb-2 border-2
                  ${
                    isCompleted
                      ? "bg-green-50 border-green-500"
                      : isCurrent
                        ? "bg-blue-50 border-blue-500 shadow-lg ring-4 ring-blue-100"
                        : "bg-gray-50 border-gray-300"
                  }
                `}
              >
                {isCompleted ? (
                  <CheckCircle className="w-6 h-6 sm:w-8 sm:h-8 text-green-600" />
                ) : (
                  <IconComponent 
                    className={`w-5 h-5 sm:w-7 sm:h-7 ${isCurrent ? iconColor : "text-gray-400"}`}
                  />
                )}
              </div>

              {/* Step Label */}
              <p
                className={`text-xs sm:text-sm font-semibold text-center transition-colors px-1
                  ${
                    isCurrent
                      ? "text-blue-600"
                      : isCompleted
                        ? "text-green-600"
                        : "text-gray-500"
                  }
                `}
              >
                {step}
              </p>

              {/* Step Number Badge */}
              <span
                className={`text-xs font-bold mt-1
                  ${
                    isCurrent
                      ? "text-blue-600"
                      : isCompleted
                        ? "text-green-600"
                        : "text-gray-400"
                  }
                `}
              >
                {stepNumber}/4
              </span>
            </div>
          )
        })}
      </div>

      {/* Current Step Description */}
      <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border-l-4 border-blue-500">
        <p className="text-sm sm:text-base font-medium text-gray-800 flex items-center gap-2">
          {getStepIcon(currentStep)}
          <span>{getStepDescription(currentStep)}</span>
        </p>
      </div>
    </div>
  )
}

// ============================================
// HELPER - Step Icons
// ============================================

function getStepIcon(currentStep: number): JSX.Element {
  switch (currentStep) {
    case 1:
      return <FileText className="w-5 h-5 text-blue-600 flex-shrink-0" />
    case 2:
      return <FolderOpen className="w-5 h-5 text-purple-600 flex-shrink-0" />
    case 3:
      return <Globe className="w-5 h-5 text-green-600 flex-shrink-0" />
    case 4:
      return <CreditCard className="w-5 h-5 text-orange-600 flex-shrink-0" />
    default:
      return <FileText className="w-5 h-5 text-gray-600 flex-shrink-0" />
  }
}

// ============================================
// HELPER - Step Descriptions
// ============================================

function getStepDescription(currentStep: number): string {
  switch (currentStep) {
    case 1:
      return "Remplissez vos informations personnelles"
    case 2:
      return "Téléchargez vos documents requis"
    case 3:
      return "Sélectionnez votre offre et pays"
    case 4:
      return "Choisissez votre mode de paiement"
    default:
      return `Étape ${currentStep}`
  }
}