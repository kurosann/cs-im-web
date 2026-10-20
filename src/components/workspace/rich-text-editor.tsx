"use client"

import { EditorContent, useEditor, type Editor } from "@tiptap/react"
import StarterKit from "@tiptap/starter-kit"
import {
  Bold,
  Heading1,
  Heading2,
  Italic,
  List,
  ListOrdered,
  Quote,
  Redo2,
  Strikethrough,
  Undo2,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"

type ToolbarAction = {
  icon: typeof Bold
  label: string
  action: (editor: Editor) => void
  isActive: (editor: Editor) => boolean
}

const toolbarActions: ToolbarAction[] = [
  {
    icon: Bold,
    label: "加粗",
    action: (editor) => editor.chain().focus().toggleBold().run(),
    isActive: (editor) => editor.isActive("bold"),
  },
  {
    icon: Italic,
    label: "斜体",
    action: (editor) => editor.chain().focus().toggleItalic().run(),
    isActive: (editor) => editor.isActive("italic"),
  },
  {
    icon: Strikethrough,
    label: "删除线",
    action: (editor) => editor.chain().focus().toggleStrike().run(),
    isActive: (editor) => editor.isActive("strike"),
  },
  {
    icon: Heading1,
    label: "标题 1",
    action: (editor) => editor.chain().focus().toggleHeading({ level: 1 }).run(),
    isActive: (editor) => editor.isActive("heading", { level: 1 }),
  },
  {
    icon: Heading2,
    label: "标题 2",
    action: (editor) => editor.chain().focus().toggleHeading({ level: 2 }).run(),
    isActive: (editor) => editor.isActive("heading", { level: 2 }),
  },
  {
    icon: List,
    label: "无序列表",
    action: (editor) => editor.chain().focus().toggleBulletList().run(),
    isActive: (editor) => editor.isActive("bulletList"),
  },
  {
    icon: ListOrdered,
    label: "有序列表",
    action: (editor) => editor.chain().focus().toggleOrderedList().run(),
    isActive: (editor) => editor.isActive("orderedList"),
  },
  {
    icon: Quote,
    label: "引用",
    action: (editor) => editor.chain().focus().toggleBlockquote().run(),
    isActive: (editor) => editor.isActive("blockquote"),
  },
]

export function RichTextEditor({
  value,
  onChange,
}: {
  value: string
  onChange: (value: string) => void
}) {
  const editor = useEditor({
    extensions: [StarterKit.configure({ heading: { levels: [1, 2] } })],
    content: normalizeRichText(value),
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class: "typeset-docs min-h-48 max-h-72 overflow-y-auto px-3 py-2 focus:outline-none",
      },
    },
    onUpdate: ({ editor: currentEditor }) => {
      onChange(currentEditor.isEmpty ? "" : currentEditor.getHTML())
    },
  })

  if (!editor) {
    return <div className="min-h-48 rounded-lg border border-input bg-transparent" />
  }

  return (
    <div className="overflow-hidden rounded-lg border border-input bg-transparent focus-within:ring-[3px] focus-within:ring-ring/50">
      <div className="flex flex-wrap items-center gap-1 border-b border-border bg-muted/40 px-1.5 py-1.5">
        {toolbarActions.map((item, index) => (
          <span key={item.label} className="flex items-center gap-1">
            {index === 3 ? <Separator orientation="vertical" className="mx-1 h-4" /> : null}
            <Button
              type="button"
              size="icon-xs"
              variant={item.isActive(editor) ? "secondary" : "ghost"}
              aria-label={item.label}
              aria-pressed={item.isActive(editor)}
              title={item.label}
              onClick={() => item.action(editor)}
            >
              <item.icon className="size-3.5" />
            </Button>
          </span>
        ))}

        <Separator orientation="vertical" className="mx-1 h-4" />
        <Button
          type="button"
          size="icon-xs"
          variant="ghost"
          aria-label="撤销"
          title="撤销"
          disabled={!editor.can().undo()}
          onClick={() => editor.chain().focus().undo().run()}
        >
          <Undo2 className="size-3.5" />
        </Button>
        <Button
          type="button"
          size="icon-xs"
          variant="ghost"
          aria-label="重做"
          title="重做"
          disabled={!editor.can().redo()}
          onClick={() => editor.chain().focus().redo().run()}
        >
          <Redo2 className="size-3.5" />
        </Button>
      </div>

      <EditorContent editor={editor} />
    </div>
  )
}

export function normalizeRichText(value: string) {
  if (value.trim().startsWith("<")) {
    return value
  }

  const paragraphs = value
    .split(/\n+/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean)

  if (!paragraphs.length) {
    return "<p></p>"
  }

  return paragraphs.map((paragraph) => `<p>${escapeHtml(paragraph)}</p>`).join("")
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
}
