// lib/cloudinaryService.ts
import { v2 as cloudinary } from 'cloudinary'

// Configure Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
})

export interface UploadResult {
    publicId: string
    url: string
    secureUrl: string
    format: string
    size: number
    originalFilename: string
    folder: string
}

/**
 * Upload a file buffer to Cloudinary
 */
export async function uploadToCloudinary(
    buffer: Buffer,
    fileName: string,
    options?: {
        folder?: string
        resourceType?: 'image' | 'raw' | 'auto'
        publicId?: string
    }
): Promise<UploadResult> {
    const { folder = 'nch-community', resourceType = 'auto', publicId } = options || {}

    // Validate configuration
    if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
        throw new Error('Cloudinary configuration missing. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET')
    }

    return new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
            {
                folder,
                resource_type: resourceType,
                public_id: publicId || `${Date.now()}_${fileName.replace(/\.[^/.]+$/, '')}`,
                use_filename: true,
                unique_filename: true,
            },
            (error, result) => {
                if (error) {
                    console.error('❌ Cloudinary upload error:', error)
                    reject(new Error(`Cloudinary upload failed: ${error.message}`))
                    return
                }

                if (!result) {
                    reject(new Error('Cloudinary upload returned no result'))
                    return
                }

                console.log('✅ Cloudinary upload success:', result.public_id)
                
                resolve({
                    publicId: result.public_id,
                    url: result.url,
                    secureUrl: result.secure_url,
                    format: result.format,
                    size: result.bytes,
                    originalFilename: fileName,
                    folder: folder,
                })
            }
        )

        // Write buffer to upload stream
        uploadStream.end(buffer)
    })
}

/**
 * Delete a file from Cloudinary
 */
export async function deleteFromCloudinary(publicId: string, resourceType: 'image' | 'raw' = 'raw'): Promise<boolean> {
    try {
        const result = await cloudinary.uploader.destroy(publicId, { resource_type: resourceType })
        console.log('🗑️ Cloudinary delete result:', result)
        return result.result === 'ok'
    } catch (error: any) {
        console.error('❌ Cloudinary delete error:', error)
        throw new Error(`Failed to delete from Cloudinary: ${error.message}`)
    }
}

/**
 * Get a URL for viewing/downloading a file
 * For PDFs: Use fl_attachment for download, or direct URL for viewing
 * For Images: Direct URL works for both
 */
export function getCloudinaryUrl(publicId: string, options?: { 
    download?: boolean
    resourceType?: 'image' | 'raw'
}): string {
    const resourceType = options?.resourceType || 'raw'
    
    if (options?.download) {
        return cloudinary.url(publicId, {
            flags: 'attachment',
            resource_type: resourceType,
            secure: true
        })
    }
    return cloudinary.url(publicId, { 
        resource_type: resourceType,
        secure: true 
    })
}

/**
 * Get a viewable URL for documents (works in browser)
 * For Cloudinary, this returns the secure URL
 */
export function getViewableUrl(url: string): string {
    // Ensure HTTPS
    if (url && url.startsWith('http://')) {
        return url.replace('http://', 'https://')
    }
    return url
}

/**
 * Generate a client folder name
 */
export function generateClientFolderName(firstName: string, lastName: string): string {
    const randomNumber = Math.floor(Math.random() * 100000)
    const cleanFirstName = firstName.replace(/[^a-zA-Z0-9]/g, '').toLowerCase()
    const cleanLastName = lastName.replace(/[^a-zA-Z0-9]/g, '').toLowerCase()
    return `nch-community/${cleanFirstName}-${cleanLastName}-${randomNumber}`
}

export { cloudinary }
