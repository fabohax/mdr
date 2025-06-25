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
  const resolveMarkdownLink = (linkHref: string): { type: "internal" | "external" | "broken"; path?: string } => {
    // Remove any anchors/fragments
    const cleanHref = linkHref.split("#")[0]

    // Skip external links
    if (cleanHref.startsWith("http://") || cleanHref.startsWith("https://")) {
      return { type: "external" }
    }

    if (!rootDirectory || !onFileNavigate) {
      return { type: "broken" }
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

    return targetFile ? { type: "internal", path: targetFile.path } : { type: "broken" }
  }

  useEffect(() => {
    if (!content) return

    // Enhanced markdown to HTML conversion with better formatting
    const convertMarkdownToHtml = (markdown: string) => {
      let html = markdown
        // Headers with better styling
        .replace(/^### (.*$)/gim, '<h3 class="markdown-h3">$1</h3>')
        .replace(/^## (.*$)/gim, '<h2 class="markdown-h2">$1</h2>')
        .replace(/^# (.*$)/gim, '<h1 class="markdown-h1">$1</h1>')
        // Bold and italic
        .replace(/\*\*(.*?)\*\*/gim, '<strong class="markdown-bold">$1</strong>')
        .replace(/__(.*?)__/gim, '<strong class="markdown-bold">$1</strong>')
        .replace(/\*(.*?)\*/gim, '<em class="markdown-italic">$1</em>')
        .replace(/_(.*?)_/gim, '<em class="markdown-italic">$1</em>')
        // Code blocks with syntax highlighting
        .replace(/```([\s\S]*?)```/gim, '<pre class="markdown-code-block"><code>$1</code></pre>')
        // Inline code
        .replace(/`(.*?)`/gim, '<code class="markdown-inline-code">$1</code>')
        // Blockquotes
        .replace(/^> (.*$)/gim, '<blockquote class="markdown-blockquote">$1</blockquote>')
        // Enhanced links with icons and better styling
        .replace(/\[([^\]]+)\]$$([^)]+)$$/gim, (match, text, href) => {
          const linkInfo = resolveMarkdownLink(href)

          switch (linkInfo.type) {
            case "internal":
              return `<a href="#" data-internal-link="${linkInfo.path}" class="markdown-link markdown-link-internal" title="Navigate to: ${text}">
                <span class="markdown-link-text">${text}</span>
              </a>`
            case "external":
              return `<a href="${href}" target="_blank" rel="noopener noreferrer" class="markdown-link markdown-link-external" title="Open external link: ${href}">
                <span class="markdown-link-text">${text}</span>
                <svg class="markdown-external-icon" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                  <polyline points="15,3 21,3 21,9"></polyline>
                  <line x1="10" y1="14" x2="21" y2="3"></line>
                </svg>
              </a>`
            case "broken":
              return `<span class="markdown-link markdown-link-broken" title="File not found: ${href}">
                <span class="markdown-link-text">${text}</span>
                <svg class="markdown-broken-icon" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"></circle>
                  <line x1="12" y1="8" x2="12" y2="12"></line>
                  <line x1="12" y1="16" x2="12.01" y2="16"></line>
                </svg>
              </span>`
          }
        })

      // Handle lists with better styling
      html = html.replace(/^\* (.+)$/gim, '<li class="markdown-list-item">$1</li>')
      html = html.replace(/^- (.+)$/gim, '<li class="markdown-list-item">$1</li>')
      html = html.replace(/(<li class="markdown-list-item">.*<\/li>)/gims, '<ul class="markdown-list">$1</ul>')

      // Handle numbered lists
      html = html.replace(/^\d+\. (.+)$/gim, '<li class="markdown-list-item">$1</li>')

      // Handle paragraphs and line breaks
      html = html.replace(/\n\n/gim, "</p><p class='markdown-paragraph'>")
      html = html.replace(/\n/gim, "<br>")

      // Wrap in paragraphs if not starting with a header or list
      if (!html.startsWith("<h") && !html.startsWith("<ul") && !html.startsWith("<ol") && !html.startsWith("<pre")) {
        html = "<p class='markdown-paragraph'>" + html + "</p>"
      }

      return html
    }

    setHtmlContent(convertMarkdownToHtml(content))
  }, [content, rootDirectory, onFileNavigate])

  // Handle clicks on internal links
  useEffect(() => {
    const handleLinkClick = (e: Event) => {
      const target = e.target as HTMLElement
      const link = target.closest("[data-internal-link]") as HTMLElement

      if (link) {
        e.preventDefault()
        const filePath = link.getAttribute("data-internal-link")
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
        <div className="flex items-center gap-3 text-muted-foreground">
          <Loader2 className="w-6 h-6 animate-spin" />
          <span className="text-lg">Loading file...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-background">
      {/* Content */}
      <div className="flex-1 overflow-auto">
        <div className="max-w-4xl mx-auto px-6 py-8">
          <article className="markdown-content" dangerouslySetInnerHTML={{ __html: htmlContent }} />
        </div>
      </div>
    </div>
  )
}
