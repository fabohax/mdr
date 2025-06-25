"use client"

import { useEffect, useState } from "react"
import { Loader2 } from "lucide-react"

interface MarkdownViewerProps {
  fileName: string
  content: string
  isLoading: boolean
}

export function MarkdownViewer({ fileName, content, isLoading }: MarkdownViewerProps) {
  const [htmlContent, setHtmlContent] = useState("")

  useEffect(() => {
    if (!content) return

    // Simple markdown to HTML conversion
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
        // Links
        .replace(/\[([^\]]+)\]$$([^)]+)$$/gim, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>')
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
  }, [content])

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
