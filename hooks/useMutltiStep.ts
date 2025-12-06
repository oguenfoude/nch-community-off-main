// hooks/useMultiStep.ts
import { useState } from 'react'

export const useMultiStep = (maxSteps: number) => {
  const [currentStep, setCurrentStep] = useState(0)

  const nextStep = () => {
    if (currentStep < maxSteps - 1) {
      setCurrentStep(prev => prev + 1)
    }
  }

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1)
    }
  }

  const goToStep = (step: number) => {
    if (step >= 0 && step < maxSteps) {
      setCurrentStep(step)
    }
  }

  return {
    currentStep,
    nextStep,
    prevStep,
    goToStep,
    isFirstStep: currentStep === 0,
    isLastStep: currentStep === maxSteps - 1
  }
}