"use client"

import { ChevronRight, Folder, File } from "lucide-react"
import type { FileItem } from "@/app/page"

interface FileBreadcrumbProps {
  currentFile: FileItem | null
  rootDirectory: FileItem | null
  onFileSelect: (file: FileItem) => void
}

export function FileBreadcrumb({ currentFile, rootDirectory, onFileSelect }: FileBreadcrumbProps) {
  const getBreadcrumbPath = (currentFile: FileItem, rootDirectory: FileItem): FileItem[] => {
    if (!currentFile || !rootDirectory) return []

    const findPath = (item: FileItem, targetPath: string, path: FileItem[] = []): FileItem[] | null => {
      const currentPath = [...path, item]

      if (item.path === targetPath) {
        return currentPath
      }

      if (item.children) {
        for (const child of item.children) {
          const result = findPath(child, targetPath, currentPath)
          if (result) return result
        }
      }

      return null
    }

    return findPath(rootDirectory, currentFile.path) || []
  }

  if (!currentFile || !rootDirectory) return null

  const breadcrumbPath = getBreadcrumbPath(currentFile, rootDirectory)

  return (
    <div className="flex items-center gap-1 text-sm text-muted-foreground overflow-hidden">
      {breadcrumbPath.map((item, index) => (
        <div key={item.path} className="flex items-center gap-1">
          {index > 0 && <ChevronRight className="w-3 h-3 shrink-0" />}
          <button
            onClick={() => item.type === "file" && onFileSelect(item)}
            className={`flex items-center gap-1 hover:text-foreground transition-colors truncate ${
              item.type === "file" ? "cursor-pointer" : "cursor-default"
            } ${index === breadcrumbPath.length - 1 ? "text-foreground font-medium" : ""}`}
            disabled={item.type === "directory"}
          >
            {item.type === "directory" ? (
              <Folder className="w-3 h-3 shrink-0" />
            ) : (
              <File className="w-3 h-3 shrink-0" />
            )}
            <span className="truncate">{item.name}</span>
          </button>
        </div>
      ))}
    </div>
  )
}
