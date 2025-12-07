import { Loader2 } from "lucide-react"

export default function AdminLoading() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <Loader2 className="h-10 w-10 animate-spin text-[#042d8e] mx-auto" />
        <p className="mt-4 text-gray-600 font-medium">Chargement...</p>
      </div>
    </div>
  )
}
