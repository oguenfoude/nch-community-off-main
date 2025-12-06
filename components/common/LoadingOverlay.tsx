// components/common/LoadingOverlay.tsx
export const LoadingOverlay = () => {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white p-8 rounded-lg shadow-xl flex flex-col items-center">
        <div className="h-16 w-16 border-4 border-t-nch-primary border-r-transparent border-b-nch-primary border-l-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-lg font-semibold text-gray-700">Traitement en cours...</p>
        <p className="text-sm text-gray-500 mt-2">Veuillez patienter</p>
      </div>
    </div>
  )
}