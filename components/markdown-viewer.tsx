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
  const [copiedCode, setCopiedCode] = useState<string | null>(null)

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

  // Function to escape HTML
  const escapeHtml = (text: string): string => {
    const div = document.createElement("div")
    div.textContent = text
    return div.innerHTML
  }

  // Function to copy code to clipboard
  const copyToClipboard = async (code: string, codeId: string) => {
    try {
      await navigator.clipboard.writeText(code)
      setCopiedCode(codeId)
      setTimeout(() => setCopiedCode(null), 2000)
    } catch (err) {
      console.error("Failed to copy code:", err)
    }
  }

  useEffect(() => {
    if (!content) return

    // Enhanced markdown to HTML conversion with comprehensive formatting
    const convertMarkdownToHtml = (markdown: string) => {
      let codeBlockCounter = 0

      let html = markdown
        // Headers with better styling and anchor links
        .replace(/^### (.*$)/gim, '<h3 class="markdown-h3" id="$1">$1</h3>')
        .replace(/^## (.*$)/gim, '<h2 class="markdown-h2" id="$1">$1</h2>')
        .replace(/^# (.*$)/gim, '<h1 class="markdown-h1" id="$1">$1</h1>')

        // Strikethrough
        .replace(/~~(.*?)~~/gim, '<del class="markdown-strikethrough">$1</del>')

        // Bold and italic (order matters)
        .replace(/\*\*\*(.*?)\*\*\*/gim, '<strong class="markdown-bold"><em class="markdown-italic">$1</em></strong>')
        .replace(/\*\*(.*?)\*\*/gim, '<strong class="markdown-bold">$1</strong>')
        .replace(/__(.*?)__/gim, '<strong class="markdown-bold">$1</strong>')
        .replace(/\*(.*?)\*/gim, '<em class="markdown-italic">$1</em>')
        .replace(/_(.*?)_/gim, '<em class="markdown-italic">$1</em>')

        // Code blocks with language detection and syntax highlighting
        .replace(/```(\w+)?\n?([\s\S]*?)```/gim, (match, lang, code) => {
          const codeId = `code-block-${++codeBlockCounter}`
          const language = lang ? lang.toLowerCase() : "text"
          const escapedCode = escapeHtml(code.trim())

          // Map common language aliases
          const languageMap: { [key: string]: string } = {
            js: "javascript",
            ts: "typescript",
            jsx: "javascript",
            tsx: "typescript",
            py: "python",
            rb: "ruby",
            sh: "bash",
            shell: "bash",
            yml: "yaml",
            md: "markdown",
            html: "markup",
            xml: "markup",
            svg: "markup",
          }

          const prismLanguage = languageMap[language] || language

          return `<div class="markdown-code-container" data-language="${language}">
    <div class="markdown-code-header">
      <button class="markdown-copy-button" data-copy-id="${codeId}" title="Copy code">
        <svg class="copy-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
        </svg>
        <svg class="check-icon hidden" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="20,6 9,17 4,12"></polyline>
        </svg>
      </button>
    </div>
    <pre class="markdown-code-block language-${prismLanguage}" data-code-id="${codeId}"><code class="language-${prismLanguage}">${escapedCode}</code></pre>
  </div>`
        })

        // Inline code
        .replace(/`(.*?)`/gim, '<code class="markdown-inline-code">$1</code>')

        // Blockquotes (handle nested)
        .replace(/^> (.*$)/gim, '<blockquote class="markdown-blockquote">$1</blockquote>')

        // Horizontal rules
        .replace(/^---$/gim, '<hr class="markdown-hr">')
        .replace(/^\*\*\*$/gim, '<hr class="markdown-hr">')

        // Tables
        .replace(/\|(.+)\|\n\|[-\s|:]+\|\n((?:\|.+\|\n?)*)/gim, (match, header, rows) => {
          const headerCells = header
            .split("|")
            .map((cell) => cell.trim())
            .filter((cell) => cell)
          const headerRow = headerCells.map((cell) => `<th class="markdown-th">${cell}</th>`).join("")

          const bodyRows = rows
            .trim()
            .split("\n")
            .map((row) => {
              const cells = row
                .split("|")
                .map((cell) => cell.trim())
                .filter((cell) => cell)
              return `<tr class="markdown-tr">${cells.map((cell) => `<td class="markdown-td">${cell}</td>`).join("")}</tr>`
            })
            .join("")

          return `<table class="markdown-table">
          <thead class="markdown-thead">
            <tr class="markdown-tr">${headerRow}</tr>
          </thead>
          <tbody class="markdown-tbody">
            ${bodyRows}
          </tbody>
        </table>`
        })

        // Enhanced links with icons and better styling
        .replace(/\[([^\]]+)\]$$([^)]+)$$/gim, (match, text, href) => {
          const linkInfo = resolveMarkdownLink(href.trim())

          switch (linkInfo.type) {
            case "internal":
              return `<a href="#" data-internal-link="${linkInfo.path}" class="markdown-link markdown-link-internal" title="Navigate to: ${text}">
        <svg class="markdown-internal-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M9 12l2 2 4-4"></path>
          <path d="M21 12c0 4.97-4.03 9-9 9s-9-4.03-9-9 4.03-9 9-9c2.12 0 4.04.74 5.56 1.97"></path>
        </svg>
        <span class="markdown-link-text">${text}</span>
      </a>`

            case "external":
              return `<a href="${href}" target="_blank" rel="noopener noreferrer" class="markdown-link markdown-link-external" title="Open external link: ${href}">
        <svg class="markdown-external-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
          <polyline points="15,3 21,3 21,9"></polyline>
          <line x1="10" y1="14" x2="21" y2="3"></line>
        </svg>
        <span class="markdown-link-text">${text}</span>
      </a>`

            default:
              return `<span class="markdown-link markdown-link-broken" title="File not found: ${href}">
        <svg class="markdown-broken-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="12" y1="8" x2="12" y2="12"></line>
          <line x1="12" y1="16" x2="12.01" y2="16"></line>
        </svg>
        <span class="markdown-link-text">${text}</span>
      </span>`
          }
        })

      // Handle task lists (checkboxes)
      html = html.replace(
        /^- \[x\] (.+)$/gim,
        '<li class="markdown-task-item markdown-task-done"><input type="checkbox" checked disabled class="markdown-checkbox"> $1</li>',
      )
      html = html.replace(
        /^- \[ \] (.+)$/gim,
        '<li class="markdown-task-item"><input type="checkbox" disabled class="markdown-checkbox"> $1</li>',
      )

      // Handle regular lists
      html = html.replace(/^\* (.+)$/gim, '<li class="markdown-list-item">$1</li>')
      html = html.replace(/^- (.+)$/gim, '<li class="markdown-list-item">$1</li>')
      html = html.replace(
        /(<li class="markdown-(?:list-item|task-item)(?:\s+markdown-task-done)?".*?<\/li>)/gims,
        '<ul class="markdown-list">$1</ul>',
      )

      // Handle numbered lists
      html = html.replace(/^\d+\. (.+)$/gim, '<li class="markdown-list-item">$1</li>')

      // Handle paragraphs and line breaks - improved logic
      const lines = html.split("\n")
      const result = []
      let currentParagraph = []
      const inCodeBlock = false

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim()

        // Check if we're entering or leaving a code block
        if (line.includes('<div class="markdown-code-container"')) {
          // Finish current paragraph if any
          if (currentParagraph.length > 0) {
            const paragraphText = currentParagraph.join(" ").trim()
            if (paragraphText) {
              result.push(`<p class="markdown-paragraph">${paragraphText}</p>`)
            }
            currentParagraph = []
          }

          // Add the code block
          let codeBlockHtml = line
          i++
          while (i < lines.length && !lines[i].includes("</div>")) {
            codeBlockHtml += "\n" + lines[i]
            i++
          }
          if (i < lines.length) {
            codeBlockHtml += "\n" + lines[i] // Add closing </div>
          }
          result.push(codeBlockHtml)
          continue
        }

        // Skip empty lines
        if (!line) {
          // Empty line - finish current paragraph if any
          if (currentParagraph.length > 0) {
            const paragraphText = currentParagraph.join(" ").trim()
            if (paragraphText) {
              result.push(`<p class="markdown-paragraph">${paragraphText}</p>`)
            }
            currentParagraph = []
          }
          continue
        }

        // Check if line is already a formatted element (headers, lists, tables, etc.)
        if (
          line.startsWith("<h") ||
          line.startsWith("<ul") ||
          line.startsWith("<ol") ||
          line.startsWith("<table") ||
          line.startsWith("<blockquote") ||
          line.startsWith("<hr") ||
          line.startsWith("<li")
        ) {
          // Finish current paragraph if any
          if (currentParagraph.length > 0) {
            const paragraphText = currentParagraph.join(" ").trim()
            if (paragraphText) {
              result.push(`<p class="markdown-paragraph">${paragraphText}</p>`)
            }
            currentParagraph = []
          }

          result.push(line)
          continue
        }

        // Regular text line - add to current paragraph
        currentParagraph.push(line)
      }

      // Finish any remaining paragraph
      if (currentParagraph.length > 0) {
        const paragraphText = currentParagraph.join(" ").trim()
        if (paragraphText) {
          result.push(`<p class="markdown-paragraph">${paragraphText}</p>`)
        }
      }

      html = result.join("\n")

      return html
    }

    setHtmlContent(convertMarkdownToHtml(content))
  }, [content, rootDirectory, onFileNavigate])

  // Load Prism.js and apply syntax highlighting
  useEffect(() => {
    if (!htmlContent) return

    const loadPrism = async () => {
      // Load Prism CSS
      if (!document.querySelector('link[href*="prism"]')) {
        const link = document.createElement("link")
        link.rel = "stylesheet"
        link.href = "https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/themes/prism-tomorrow.min.css"
        link.crossOrigin = "anonymous"
        document.head.appendChild(link)
      }

      /** Load an external script only once, with CORS. */
      const loadOnce = (src: string) =>
        new Promise<void>((resolve, reject) => {
          if (document.querySelector(`script[src="${src}"]`)) return resolve() // already present
          const s = document.createElement("script")
          s.src = src
          s.crossOrigin = "anonymous"
          s.onload = () => resolve()
          s.onerror = reject
          document.head.appendChild(s)
        })

      try {
        // 1️⃣ Load Prism core first
        await loadOnce("https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/components/prism-core.min.js")

        // 2️⃣ Load clike (required for many languages)
        await loadOnce("https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/components/prism-clike.min.js")

        // 3️⃣ Load javascript (required for jsx/tsx)
        await loadOnce("https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/components/prism-javascript.min.js")

        // 4️⃣ Now load other languages in parallel
        const langFiles = ["markup", "css", "typescript", "jsx", "python", "bash", "json", "yaml", "markdown"] as const

        await Promise.all(
          langFiles.map((l) =>
            loadOnce(`https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/components/prism-${l}.min.js`),
          ),
        )

        // 5️⃣ Highlight after all scripts load
        if (window.Prism) {
          window.Prism.highlightAll()
        }
      } catch (error) {
        console.warn("Failed to load Prism:", error)
      }
    }

    loadPrism()
  }, [htmlContent])

  // Attach copy-to-clipboard listeners once the HTML is in the DOM
  useEffect(() => {
    const buttons = document.querySelectorAll<HTMLButtonElement>(".markdown-copy-button")
    const handleClick = async (e: MouseEvent) => {
      const btn = e.currentTarget as HTMLButtonElement
      const codeId = btn.dataset.copyId
      if (!codeId) return

      const codeElement = document.querySelector(`[data-code-id="${codeId}"] code`)
      if (!codeElement?.textContent) return

      try {
        await navigator.clipboard.writeText(codeElement.textContent)
        const copyIcon = btn.querySelector(".copy-icon")
        const checkIcon = btn.querySelector(".check-icon")
        copyIcon?.classList.add("hidden")
        checkIcon?.classList.remove("hidden")
        setTimeout(() => {
          copyIcon?.classList.remove("hidden")
          checkIcon?.classList.add("hidden")
        }, 2000)
      } catch {
        console.error("Failed to copy code")
      }
    }

    buttons.forEach((btn) => btn.addEventListener("click", handleClick))
    return () => buttons.forEach((btn) => btn.removeEventListener("click", handleClick))
  }, [htmlContent])

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
        <div className="max-w-5xl mx-auto px-6 py-8">
          <article className="markdown-content" dangerouslySetInnerHTML={{ __html: htmlContent }} />
        </div>
      </div>
    </div>
  )
}

// Extend window type for Prism
declare global {
  interface Window {
    Prism: any
  }
}
