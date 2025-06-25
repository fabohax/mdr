"use client"

import { useEffect, useState } from "react"
import { Loader2 } from "lucide-react"
import type { FileItem } from "@/app/page"

interface MarkdownViewerProps {
  fileName: string
  content: string
  isLoading: boolean
  onFileNavigate?: (filePath: string) => void
  rootDirectory?: FileItem | null
}

export function MarkdownViewer({ fileName, content, isLoading, onFileNavigate, rootDirectory }: MarkdownViewerProps) {
  const [htmlContent, setHtmlContent] = useState("")

  // Function to find a file in the directory tree by name or path
  const findFileInTree = (tree: FileItem | null, targetName: string): FileItem | null => {
    if (!tree) return null

    const searchInItem = (item: FileItem): FileItem | null => {
      // Check if this item matches (by name or path)
      if (item.type === "file") {
        const itemNameLower = item.name.toLowerCase()
        const targetLower = targetName.toLowerCase()

        // Match by exact name
        if (itemNameLower === targetLower) return item

        // Match by name without extension
        if (itemNameLower === targetLower + ".md") return item
        if (itemNameLower.replace(".md", "") === targetLower) return item

        // Match by path segments
        if (item.path.toLowerCase().includes(targetLower)) return item
      }

      // Search in children
      if (item.children) {
        for (const child of item.children) {
          const found = searchInItem(child)
          if (found) return found
        }
      }

      return null
    }

    return searchInItem(tree)
  }

  // Function to resolve markdown links to file paths
  const resolveMarkdownLink = (linkHref: string): string | null => {
    if (!rootDirectory || !onFileNavigate) return null

    // Remove any anchors/fragments
    const cleanHref = linkHref.split("#")[0]

    // Skip external links
    if (cleanHref.startsWith("http://") || cleanHref.startsWith("https://")) {
      return null
    }

    // Try to find the file
    let targetFile: FileItem | null = null

    // Try different resolution strategies
    const strategies = [
      cleanHref, // Direct path
      cleanHref + ".md", // Add .md extension
      cleanHref.replace(/^\.\//, ""), // Remove relative prefix
      cleanHref.replace(/^\//, ""), // Remove absolute prefix
      cleanHref.split("/").pop() || "", // Just the filename
    ]

    for (const strategy of strategies) {
      targetFile = findFileInTree(rootDirectory, strategy)
      if (targetFile) break
    }

    return targetFile ? targetFile.path : null
  }

  useEffect(() => {
    if (!content) return

    // Enhanced markdown to HTML conversion with link handling
    const convertMarkdownToHtml = (markdown: string) => {
      let html = markdown
        // Headers
        .replace(/^### (.*$)/gim, "<h3>$1</h3>")
        .replace(/^## (.*$)/gim, "<h2>$1</h2>")
        .replace(/^# (.*$)/gim, "<h1>$1</h1>")
        // Bold
        .replace(/\*\*(.*)\*\*/gim, "<strong>$1</strong>")
        .replace(/__(.*?)__/gim, "<strong>$1</strong>")
        // Italic
        .replace(/\*(.*)\*/gim, "<em>$1</em>")
        .replace(/_(.*?)_/gim, "<em>$1</em>")
        // Code blocks
        .replace(/```([\s\S]*?)```/gim, "<pre><code>$1</code></pre>")
        // Inline code
        .replace(/`(.*?)`/gim, "<code>$1</code>")
        // Links - Enhanced to handle internal links
        .replace(/\[([^\]]+)\]$$([^)]+)$$/gim, (match, text, href) => {
          const resolvedPath = resolveMarkdownLink(href)
          if (resolvedPath && onFileNavigate) {
            return `<a href="#" data-internal-link="${resolvedPath}" class="internal-link">${text}</a>`
          } else if (href.startsWith("http://") || href.startsWith("https://")) {
            return `<a href="${href}" target="_blank" rel="noopener noreferrer" class="external-link">${text}</a>`
          } else {
            return `<a href="${href}" class="broken-link" title="File not found: ${href}">${text}</a>`
          }
        })
        // Line breaks
        .replace(/\n\n/gim, "</p><p>")
        .replace(/\n/gim, "<br>")

      // Handle lists
      html = html.replace(/^\* (.+)$/gim, "<li>$1</li>")
      html = html.replace(/^- (.+)$/gim, "<li>$1</li>")
      html = html.replace(/(<li>.*<\/li>)/gims, "<ul>$1</ul>")

      // Handle numbered lists
      html = html.replace(/^\d+\. (.+)$/gim, "<li>$1</li>")

      // Wrap in paragraphs
      if (!html.startsWith("<h") && !html.startsWith("<ul") && !html.startsWith("<ol") && !html.startsWith("<pre")) {
        html = "<p>" + html + "</p>"
      }

      return html
    }

    setHtmlContent(convertMarkdownToHtml(content))
  }, [content, rootDirectory, onFileNavigate])

  // Handle clicks on internal links
  useEffect(() => {
    const handleLinkClick = (e: Event) => {
      const target = e.target as HTMLElement
      if (target.tagName === "A" && target.hasAttribute("data-internal-link")) {
        e.preventDefault()
        const filePath = target.getAttribute("data-internal-link")
        if (filePath && onFileNavigate) {
          onFileNavigate(filePath)
        }
      }
    }

    document.addEventListener("click", handleLinkClick)
    return () => document.removeEventListener("click", handleLinkClick)
  }, [onFileNavigate])

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center h-full">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span>Loading file...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden">
      {/* Content */}
      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-4xl mx-auto">
          <div
            className="prose prose-gray dark:prose-invert max-w-none"
            style={{
              lineHeight: "1.7",
            }}
            dangerouslySetInnerHTML={{ __html: htmlContent }}
          />
        </div>
      </div>
    </div>
  )
}
