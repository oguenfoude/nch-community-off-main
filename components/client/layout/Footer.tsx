// components/layout/Footer.tsx
export const Footer = () => {
  return (
    <footer className="bg-white border-t">
      <div className="container mx-auto px-4 py-8 text-center">
        <p className="text-sm text-gray-500">
          &copy; {new Date().getFullYear()} NCH Community. Tous droits réservés.
        </p>
      </div>
    </footer>
  )
}