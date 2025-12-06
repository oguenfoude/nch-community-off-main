// components/layout/Hero.tsx
import { Button } from '@/components/ui/button'

interface HeroProps {
  title: string
  slogan: string
  description: string
  ctaText: string
  onCtaClick: () => void
}

export const Hero = ({ title, slogan, description, ctaText, onCtaClick }: HeroProps) => {
  return (
    <section className="relative bg-nch-primary h-hero text-white py-12 sm:py-16 lg:py-20">
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage: "url('/images/hero-background.jpg?height=600&width=1200&text=Hero+Background')",
          opacity: 0.7,
        }}
      />
      <div className="absolute inset-0 bg-black opacity-40" />
      <div className="relative container mx-auto px-4 text-center">
        <h1 className="text-3xl sm:text-5xl lg:text-7xl font-bold mb-4 sm:mb-6 leading-tight">
          {title}
        </h1>
        <p className="text-lg sm:text-2xl lg:text-3xl font-semibold mb-3 sm:mb-4 text-blue-100">
          {slogan}
        </p>
        <p className="text-base sm:text-xl font-medium mb-6 sm:mb-8 max-w-2xl mx-auto text-blue-50 px-4">
          {description}
        </p>
        <Button
          size="lg"
          className="bg-white text-nch-primary hover:bg-gray-100 px-6 sm:px-12 py-3 sm:py-4 text-lg sm:text-xl font-semibold border-0 shadow-xl w-full sm:w-auto"
          onClick={onCtaClick}
        >
          {ctaText}
        </Button>
      </div>
    </section>
  )
}