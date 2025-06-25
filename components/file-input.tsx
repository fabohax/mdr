"use client"

import type React from "react"

import { useRef } from "react"
import { Button } from "@/components/ui/button"
import { FolderOpen, FileText } from "lucide-react"
import { useSidebar } from "@/components/ui/sidebar"

interface FileInputProps {
  onFilesSelected: (files: File[]) => void
  multiple?: boolean
  accept?: string
}

export function FileInput({ onFilesSelected, multiple = true, accept = ".md,.markdown" }: FileInputProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const folderInputRef = useRef<HTMLInputElement>(null)
  const { state } = useSidebar()
  const isCollapsed = state === "collapsed"

  const handleFileSelect = () => {
    fileInputRef.current?.click()
  }

  const handleFolderSelect = () => {
    folderInputRef.current?.click()
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (files.length > 0) {
      onFilesSelected(files)
    }
    // Reset input so same files can be selected again
    e.target.value = ""
  }

  const handleFolderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    const markdownFiles = files.filter(
      (file) => file.name.toLowerCase().endsWith(".md") || file.name.toLowerCase().endsWith(".markdown"),
    )
    if (markdownFiles.length > 0) {
      onFilesSelected(markdownFiles)
    }
    // Reset input so same folder can be selected again
    e.target.value = ""
  }

  if (isCollapsed) {
    // Collapsed view - show only folder icon
    return (
      <div className="flex flex-col items-center gap-2">
        {/* Hidden file inputs */}
        <input
          ref={fileInputRef}
          type="file"
          multiple={multiple}
          accept={accept}
          onChange={handleFileChange}
          style={{ display: "none" }}
        />
        <input
          ref={folderInputRef}
          type="file"
          multiple
          webkitdirectory=""
          onChange={handleFolderChange}
          style={{ display: "none" }}
        />

        <Button onClick={handleFolderSelect} size="icon" variant="outline" title="Select Folder">
          <FolderOpen className="w-4 h-4" />
        </Button>
        <Button onClick={handleFileSelect} size="icon" variant="secondary" title="Select Files">
          <FileText className="w-4 h-4" />
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {/* Hidden file inputs */}
      <input
        ref={fileInputRef}
        type="file"
        multiple={multiple}
        accept={accept}
        onChange={handleFileChange}
        style={{ display: "none" }}
      />
      <input
        ref={folderInputRef}
        type="file"
        multiple
        webkitdirectory=""
        onChange={handleFolderChange}
        style={{ display: "none" }}
      />

      {/* Folder selection button */}
      <Button onClick={handleFolderSelect} className="w-full" variant="outline">
        <FolderOpen className="w-4 h-4 mr-2" />
        Select Folder
      </Button>

      {/* Individual files selection button */}
      <Button onClick={handleFileSelect} className="w-full" variant="secondary">
        <FileText className="w-4 h-4 mr-2" />
        Select Files
      </Button>
    </div>
  )
}
