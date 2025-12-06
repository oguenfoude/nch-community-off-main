// app/test-drive/page.tsx
import { DriveUploadTest } from '@/components/DriveUploadTest'

export default function TestDrivePage() {
    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="container mx-auto px-4">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">
                        Test Upload Google Drive
                    </h1>
                    <p className="text-gray-600">
                        Testez l'upload de fichiers vers Google Drive
                    </p>
                </div>

                <DriveUploadTest />

                <div className="mt-8 text-center">
                    <div className="inline-block p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-left">
                        <h3 className="font-medium text-yellow-800 mb-2">
                            📋 Checklist de configuration :
                        </h3>
                        <ul className="text-sm text-yellow-700 space-y-1">
                            <li>✅ Variables d'environnement configurées (.env.local)</li>
                            <li>✅ Service Account créé sur Google Cloud</li>
                            <li>✅ Google Drive API activée</li>
                            <li>✅ Permissions accordées au Service Account</li>
                            <li>✅ Dossier Google Drive partagé (optionnel)</li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    )
}