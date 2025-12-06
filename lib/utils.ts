import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function safeDocumentAccess(client: any, documentKey: string): string | null {
  if (!client || !client.documents || typeof client.documents !== 'object') {
    return null
  }
  return client.documents[documentKey] || null
}

export function getDocumentProgress(client: any): { completed: number; total: number; percentage: number } {
  const requiredDocuments = ['id', 'diploma', 'photo']
  const documents = client?.documents || {}

  const completed = requiredDocuments.filter(key => documents[key]).length
  const total = requiredDocuments.length
  const percentage = Math.round((completed / total) * 100)

  return { completed, total, percentage }
}
