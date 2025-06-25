"use client"

import type React from "react"

import { useCallback, useState } from "react"
import { Upload, FileText } from "lucide-react"
import { cn } from "@/lib/utils"

interface DragDropZoneProps {
  onFilesSelected: (files: File[]) => void
  className?: string
}

export function DragDropZone({ onFilesSelected, className }: DragDropZoneProps) {
  const [isDragOver, setIsDragOver] = useState(false)

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
  }, [])

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragOver(false)

      const files = Array.from(e.dataTransfer.files).filter(
        (file) => file.name.toLowerCase().endsWith(".md") || file.name.toLowerCase().endsWith(".markdown"),
      )

      if (files.length > 0) {
        onFilesSelected(files)
      }
    },
    [onFilesSelected],
  )

  return (
    <div
      className={cn(
        "border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center transition-colors",
        isDragOver && "border-primary bg-primary/5",
        className,
      )}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <div className="flex flex-col items-center gap-4">
        <div
          className={cn(
            "w-16 h-16 rounded-full bg-muted flex items-center justify-center transition-colors",
            isDragOver && "bg-primary/10",
          )}
        >
          {isDragOver ? (
            <Upload className="w-8 h-8 text-primary" />
          ) : (
            <FileText className="w-8 h-8 text-muted-foreground" />
          )}
        </div>
        <div>
          <p className="text-lg font-medium mb-2">
            {isDragOver ? "Drop your markdown files here" : "Drag & drop markdown files"}
          </p>
          <p className="text-sm text-muted-foreground">Supports .md and .markdown files</p>
        </div>
      </div>
    </div>
  )
}
