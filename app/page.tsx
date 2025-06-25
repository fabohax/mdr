"use client"

import { useState, useCallback } from "react"
import { FileExplorer } from "@/components/file-explorer"
import { MarkdownViewer } from "@/components/markdown-viewer"
import { FolderOpen } from "lucide-react"
import { DragDropZone } from "@/components/drag-drop-zone"
import { FileInput } from "@/components/file-input"
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"

export interface FileItem {
  name: string
  path: string
  type: "file" | "directory"
  handle?: FileSystemFileHandle | File
  children?: FileItem[]
}

export default function MarkdownReaderApp() {
  const [rootDirectory, setRootDirectory] = useState<FileItem | null>(null)
  const [selectedFile, setSelectedFile] = useState<FileItem | null>(null)
  const [fileContent, setFileContent] = useState<string>("")
  const [isLoading, setIsLoading] = useState(false)

  const buildFileTree = async (dirHandle: FileSystemDirectoryHandle, name: string, path = ""): Promise<FileItem> => {
    const currentPath = path ? `${path}/${name}` : name
    const item: FileItem = {
      name,
      path: currentPath,
      type: "directory",
      handle: dirHandle,
      children: [],
    }

    try {
      for await (const [entryName, entryHandle] of dirHandle.entries()) {
        if (entryHandle.kind === "directory") {
          const childDir = await buildFileTree(entryHandle, entryName, currentPath)
          item.children!.push(childDir)
        } else if (entryHandle.kind === "file" && entryName.toLowerCase().endsWith(".md")) {
          item.children!.push({
            name: entryName,
            path: `${currentPath}/${entryName}`,
            type: "file",
            handle: entryHandle,
          })
        }
      }
    } catch (error) {
      console.error("Error reading directory:", error)
    }

    // Sort children: directories first, then files, both alphabetically
    item.children!.sort((a, b) => {
      if (a.type !== b.type) {
        return a.type === "directory" ? -1 : 1
      }
      return a.name.localeCompare(b.name)
    })

    return item
  }

  const buildFileTreeFromFiles = (files: File[]): FileItem => {
    const root: FileItem = {
      name: "Selected Files",
      path: "root",
      type: "directory",
      children: [],
    }

    const pathMap = new Map<string, FileItem>()
    pathMap.set("root", root)

    files.forEach((file) => {
      // Handle both folder selection (with webkitRelativePath) and individual file selection
      const pathParts = file.webkitRelativePath ? file.webkitRelativePath.split("/") : [file.name]

      let currentPath = "root"

      // Create directory structure (skip if it's just a single file)
      if (pathParts.length > 1) {
        for (let i = 0; i < pathParts.length - 1; i++) {
          const dirName = pathParts[i]
          const newPath = `${currentPath}/${dirName}`

          if (!pathMap.has(newPath)) {
            const dirItem: FileItem = {
              name: dirName,
              path: newPath,
              type: "directory",
              children: [],
            }
            pathMap.set(newPath, dirItem)

            const parent = pathMap.get(currentPath)!
            parent.children!.push(dirItem)
          }

          currentPath = newPath
        }
      }

      // Add the file
      const fileName = pathParts[pathParts.length - 1]
      if (fileName.toLowerCase().endsWith(".md") || fileName.toLowerCase().endsWith(".markdown")) {
        const fileItem: FileItem = {
          name: fileName,
          path: `${currentPath}/${fileName}`,
          type: "file",
          handle: file,
        }

        const parent = pathMap.get(currentPath)!
        parent.children!.push(fileItem)
      }
    })

    // Sort all children recursively
    const sortChildren = (item: FileItem) => {
      if (item.children) {
        item.children.sort((a, b) => {
          if (a.type !== b.type) {
            return a.type === "directory" ? -1 : 1
          }
          return a.name.localeCompare(b.name)
        })
        item.children.forEach(sortChildren)
      }
    }

    sortChildren(root)
    return root
  }

  const handleDragDropFiles = useCallback((files: File[]) => {
    if (files.length === 0) return

    const rootItem: FileItem = {
      name: "Dropped Files",
      path: "root",
      type: "directory",
      children: files.map((file) => ({
        name: file.name,
        path: `root/${file.name}`,
        type: "file" as const,
        handle: file,
      })),
    }

    // Sort files alphabetically
    rootItem.children!.sort((a, b) => a.name.localeCompare(b.name))

    setRootDirectory(rootItem)
  }, [])

  const handleFileSelect = useCallback(async (file: FileItem) => {
    if (file.type !== "file" || !file.handle) return

    setIsLoading(true)
    setSelectedFile(file)

    try {
      let content: string

      if (file.handle instanceof File) {
        // Handle File object (fallback mode)
        content = await file.handle.text()
      } else {
        // Handle FileSystemFileHandle (modern API)
        const fileHandle = file.handle as FileSystemFileHandle
        const fileData = await fileHandle.getFile()
        content = await fileData.text()
      }

      setFileContent(content)
    } catch (error) {
      console.error("Error reading file:", error)
      setFileContent("Error reading file. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }, [])

  return (
    <SidebarProvider>
      <div className="flex h-screen w-full">
        {/* Fixed Collapsible Sidebar */}
        <Sidebar collapsible="icon" className="border-r">
          <SidebarHeader className="border-b border-border">
            <div className="p-4 space-y-2">
              <FileInput
                onFilesSelected={(files) => {
                  const rootItem = buildFileTreeFromFiles(files)
                  setRootDirectory(rootItem)
                }}
              />
              <p className="text-xs text-muted-foreground text-center group-data-[collapsible=icon]:hidden">
                Select a folder or individual .md files, or drag & drop them below
              </p>
            </div>
          </SidebarHeader>

          <SidebarContent className="overflow-auto">
            {rootDirectory ? (
              <div className="p-2">
                <FileExplorer rootItem={rootDirectory} onFileSelect={handleFileSelect} selectedFile={selectedFile} />
              </div>
            ) : (
              <div className="p-4 group-data-[collapsible=icon]:p-2">
                <div className="group-data-[collapsible=icon]:hidden">
                  <DragDropZone onFilesSelected={handleDragDropFiles} className="mb-4" />
                  <div className="text-center text-muted-foreground">
                    <p className="text-sm">Drop markdown files above or use the select button</p>
                  </div>
                </div>
                <div className="group-data-[collapsible=icon]:block hidden">
                  <div className="flex flex-col items-center gap-2 text-center">
                    <FolderOpen className="w-8 h-8 text-muted-foreground" />
                    <p className="text-xs text-muted-foreground">No files</p>
                  </div>
                </div>
              </div>
            )}
          </SidebarContent>
        </Sidebar>

        {/* Main Content Area */}
        <SidebarInset className="flex flex-col">
          {/* Header with Sidebar Toggle */}
          <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-2 h-4" />
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-semibold">Markdown Reader</h1>
              {selectedFile && (
                <>
                  <Separator orientation="vertical" className="h-4" />
                  <span className="text-sm text-muted-foreground">{selectedFile.name}</span>
                </>
              )}
            </div>
          </header>

          {/* Main Content */}
          <main className="flex-1 overflow-hidden">
            {selectedFile ? (
              <MarkdownViewer fileName={selectedFile.name} content={fileContent} isLoading={isLoading} />
            ) : (
              <div className="flex-1 flex items-center justify-center text-center text-muted-foreground h-full">
                <div>
                  <div className="w-24 h-24 mx-auto mb-4 rounded-lg bg-muted flex items-center justify-center">
                    <FolderOpen className="w-12 h-12 opacity-50" />
                  </div>
                  <h3 className="text-lg font-medium mb-2">No file selected</h3>
                  <p>Choose a markdown file from the sidebar to view its content</p>
                </div>
              </div>
            )}
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  )
}
