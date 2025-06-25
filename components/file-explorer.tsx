"use client"

import { useState } from "react"
import { ChevronRight, ChevronDown, File, Folder, FolderOpen } from "lucide-react"
import { cn } from "@/lib/utils"
import type { FileItem } from "@/app/page"
import { useSidebar } from "@/components/ui/sidebar"

interface FileExplorerProps {
  rootItem: FileItem
  onFileSelect: (file: FileItem) => void
  selectedFile: FileItem | null
}

interface FileTreeItemProps {
  item: FileItem
  level: number
  onFileSelect: (file: FileItem) => void
  selectedFile: FileItem | null
}

function FileTreeItem({ item, level, onFileSelect, selectedFile }: FileTreeItemProps) {
  const [isExpanded, setIsExpanded] = useState(level === 0)
  const { state } = useSidebar()
  const isCollapsed = state === "collapsed"
  const isSelected = selectedFile?.path === item.path
  const hasChildren = item.children && item.children.length > 0

  const handleClick = () => {
    if (item.type === "directory") {
      setIsExpanded(!isExpanded)
    } else {
      onFileSelect(item)
    }
  }

  const getIcon = () => {
    if (item.type === "directory") {
      return isExpanded ? (
        <FolderOpen className="w-4 h-4 text-blue-500 shrink-0" />
      ) : (
        <Folder className="w-4 h-4 text-blue-500 shrink-0" />
      )
    }
    return <File className="w-4 h-4 text-gray-500 shrink-0" />
  }

  const getChevron = () => {
    if (item.type === "directory" && hasChildren && !isCollapsed) {
      return isExpanded ? (
        <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" />
      ) : (
        <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
      )
    }
    return !isCollapsed ? <div className="w-4 h-4 shrink-0" /> : null
  }

  if (isCollapsed) {
    // Collapsed view - show only icons
    return (
      <div>
        <div
          className={cn(
            "flex items-center justify-center p-2 cursor-pointer hover:bg-accent rounded-sm transition-colors",
            isSelected && "bg-accent",
          )}
          onClick={handleClick}
          title={item.name}
        >
          {getIcon()}
        </div>
        {/* Don't show children when collapsed */}
      </div>
    )
  }

  return (
    <div>
      <div
        className={cn(
          "flex items-center gap-2 px-2 py-1.5 cursor-pointer hover:bg-accent rounded-sm transition-colors",
          isSelected && "bg-accent",
          "text-sm",
        )}
        style={{ paddingLeft: `${level * 16 + 8}px` }}
        onClick={handleClick}
      >
        {getChevron()}
        {getIcon()}
        <span className="truncate flex-1 min-w-0" title={item.name}>
          {item.name}
        </span>
      </div>

      {item.type === "directory" && isExpanded && hasChildren && !isCollapsed && (
        <div>
          {item.children!.map((child) => (
            <FileTreeItem
              key={child.path}
              item={child}
              level={level + 1}
              onFileSelect={onFileSelect}
              selectedFile={selectedFile}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export function FileExplorer({ rootItem, onFileSelect, selectedFile }: FileExplorerProps) {
  return (
    <div>
      <FileTreeItem item={rootItem} level={0} onFileSelect={onFileSelect} selectedFile={selectedFile} />
    </div>
  )
}
