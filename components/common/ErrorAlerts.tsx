// components/common/ErrorAlert.tsx
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertCircle } from 'lucide-react'

interface ErrorAlertProps {
    message: string
}

export const ErrorAlert = ({ message }: ErrorAlertProps) => {
    return (
        <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{message}</AlertDescription>
        </Alert>
    )
}