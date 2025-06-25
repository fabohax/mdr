"use client"

import { ChevronUp, ChevronDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { FileItem } from "@/app/page"

interface FileNavigationProps {
  currentFile: FileItem | null
  rootDirectory: FileItem | null
  onFileSelect: (file: FileItem) => void
}

export function FileNavigation({ currentFile, rootDirectory, onFileSelect }: FileNavigationProps) {
  // Get all files in the same directory as the current file
  const getSiblingFiles = (currentFile: FileItem, rootDirectory: FileItem): FileItem[] => {
    if (!currentFile || !rootDirectory) return []

    const findParentAndSiblings = (item: FileItem, targetPath: string): FileItem[] | null => {
      if (item.children) {
        // Check if the target file is a direct child
        const isDirectChild = item.children.some((child) => child.path === targetPath)
        if (isDirectChild) {
          // Return all file children (not directories)
          return item.children.filter((child) => child.type === "file")
        }

        // Search in subdirectories
        for (const child of item.children) {
          const result = findParentAndSiblings(child, targetPath)
          if (result) return result
        }
      }
      return null
    }

    return findParentAndSiblings(rootDirectory, currentFile.path) || []
  }

  const getNavigationInfo = () => {
    if (!currentFile || !rootDirectory) {
      return { prevFile: null, nextFile: null, currentIndex: -1, totalFiles: 0 }
    }

    const siblingFiles = getSiblingFiles(currentFile, rootDirectory)
    const currentIndex = siblingFiles.findIndex((file) => file.path === currentFile.path)

    const prevFile = currentIndex > 0 ? siblingFiles[currentIndex - 1] : null
    const nextFile = currentIndex < siblingFiles.length - 1 ? siblingFiles[currentIndex + 1] : null

    return {
      prevFile,
      nextFile,
      currentIndex: currentIndex + 1, // 1-based for display
      totalFiles: siblingFiles.length,
    }
  }

  const { prevFile, nextFile, currentIndex, totalFiles } = getNavigationInfo()

  if (!currentFile || totalFiles <= 1) {
    return null // Don't show navigation if there's only one file or no file selected
  }

  return (
    <div className="flex items-center gap-2">
      <Button
        variant="outline"
        size="sm"
        onClick={() => prevFile && onFileSelect(prevFile)}
        disabled={!prevFile}
        title={prevFile ? `Previous: ${prevFile.name}` : "No previous file"}
      >
        <ChevronUp className="w-4 h-4" />
      </Button>

      <span className="text-sm text-muted-foreground px-2">
        {currentIndex} of {totalFiles}
      </span>

      <Button
        variant="outline"
        size="sm"
        onClick={() => nextFile && onFileSelect(nextFile)}
        disabled={!nextFile}
        title={nextFile ? `Next: ${nextFile.name}` : "No next file"}
      >
        <ChevronDown className="w-4 h-4" />
      </Button>
    </div>
  )
}
