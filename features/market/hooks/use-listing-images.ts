
import { useState } from 'react'

export interface ListingPhoto {
    url: string
}

export function useListingImages(initialPhotos: ListingPhoto[] = []) {
    const [files, setFiles] = useState<File[]>([])
    const [existingPhotos, setExistingPhotos] = useState<ListingPhoto[]>(initialPhotos)

    const handleFilesChange = (newFiles: File[]) => {
        setFiles(newFiles)
    }

    const removeNewFile = (index: number) => {
        const newFilesList = [...files]
        newFilesList.splice(index, 1)
        setFiles(newFilesList)
    }

    const removeExistingPhoto = (index: number) => {
        const newExisting = [...existingPhotos]
        newExisting.splice(index, 1)
        setExistingPhotos(newExisting)
    }

    return {
        files,
        existingPhotos,
        handleFilesChange,
        removeNewFile,
        removeExistingPhoto
    }
}
