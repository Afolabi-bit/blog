"use client";

import { useState, useEffect, useCallback } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import TaskList from "@tiptap/extension-task-list";
import TaskItem from "@tiptap/extension-task-item";
import { Table, TableRow, TableCell, TableHeader } from "@tiptap/extension-table";
import { Markdown } from "tiptap-markdown";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Bold,
  Italic,
  Strikethrough,
  Code,
  Link2,
  List,
  ListOrdered,
  CheckSquare,
  Quote,
  FileCode,
  Minus,
  Table as TableIcon,
  Undo,
  Redo,
  Heading1,
  Heading2,
  Heading3,
  Pilcrow,
  Code2,
  FileEdit,
  Unlink,
} from "lucide-react";

interface TiptapEditorProps {
  content: string;
  onChange: (markdown: string) => void;
  disabled?: boolean;
  placeholder?: string;
}

export function TiptapEditor({
  content,
  onChange,
  disabled = false,
  placeholder = "Write your story here...",
}: TiptapEditorProps) {
  const [isSourceMode, setIsSourceMode] = useState(false);
  const [sourceContent, setSourceContent] = useState(content);
  const [linkDialogOpen, setLinkDialogOpen] = useState(false);
  const [linkUrl, setLinkUrl] = useState("");

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
        link: {
          openOnClick: false,
          HTMLAttributes: {
            class: "text-accent-solid underline underline-offset-4 hover:opacity-80",
          },
        },
      }),
      Image.configure({
        inline: true,
        allowBase64: true,
      }),
      TaskList,
      TaskItem.configure({ nested: true }),
      Table.configure({ resizable: true }),
      TableRow,
      TableHeader,
      TableCell,
      Markdown.configure({
        html: true,
        tightLists: true,
        bulletListMarker: "-",
      }),
    ],
    content,
    editable: !disabled,
    editorProps: {
      attributes: {
        class:
          "prose-bloggr min-h-[400px] w-full p-5 focus:outline-hidden sm:p-7 leading-relaxed",
        "aria-label": "Rich text article editor canvas",
      },
    },
    onUpdate: ({ editor }) => {
      // @ts-expect-error tiptap-markdown storage type
      const markdown = editor.storage.markdown.getMarkdown();
      setSourceContent(markdown);
      onChange(markdown);
    },
  });

  // Keep editor content in sync when initial content loads or changes externally
  useEffect(() => {
    if (editor && !editor.isFocused && content !== sourceContent) {
      editor.commands.setContent(content);
      setSourceContent(content);
    }
  }, [content, editor, sourceContent]);

  // Switch between WYSIWYG and Source mode
  const handleToggleSourceMode = useCallback(() => {
    if (isSourceMode) {
      // Returning to visual mode: push sourceContent to editor
      editor?.commands.setContent(sourceContent);
      setIsSourceMode(false);
    } else {
      // Entering source mode: extract latest markdown from editor
      if (editor) {
        // @ts-expect-error tiptap-markdown storage type
        const markdown = editor.storage.markdown.getMarkdown();
        setSourceContent(markdown);
      }
      setIsSourceMode(true);
    }
  }, [editor, isSourceMode, sourceContent]);

  const handleSourceChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setSourceContent(val);
    onChange(val);
  };

  const handleOpenLinkDialog = () => {
    if (!editor) return;
    const previousUrl = editor.getAttributes("link").href || "";
    setLinkUrl(previousUrl);
    setLinkDialogOpen(true);
  };

  const handleSetLink = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editor) return;

    if (!linkUrl.trim()) {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
    } else {
      let finalUrl = linkUrl.trim();
      if (!finalUrl.startsWith("http://") && !finalUrl.startsWith("https://") && !finalUrl.startsWith("/")) {
        finalUrl = `https://${finalUrl}`;
      }
      editor
        .chain()
        .focus()
        .extendMarkRange("link")
        .setLink({ href: finalUrl })
        .run();
    }
    setLinkDialogOpen(false);
  };

  const handleInsertTable = () => {
    if (!editor) return;
    editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run();
  };

  if (!editor) {
    return (
      <div className="flex h-64 w-full items-center justify-center rounded-xl border border-border bg-card">
        <p className="text-xs text-muted-foreground animate-pulse">Loading rich text editor...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col overflow-hidden rounded-xl border border-border bg-card shadow-xs">
      {/* Editor Toolbar */}
      <div
        role="toolbar"
        aria-label="Article formatting toolbar"
        className="flex flex-wrap items-center gap-1 border-b border-border/60 bg-muted/40 p-2 sm:gap-1.5"
      >
        {/* Mode Switcher */}
        <div className="flex items-center rounded-md border border-border bg-background p-0.5 mr-1 shadow-2xs">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleToggleSourceMode}
            className={`h-7 px-2.5 text-xs font-medium gap-1.5 ${
              !isSourceMode
                ? "bg-muted text-foreground font-semibold shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <FileEdit className="size-3.5" />
            <span>Visual</span>
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleToggleSourceMode}
            className={`h-7 px-2.5 text-xs font-medium gap-1.5 ${
              isSourceMode
                ? "bg-muted text-foreground font-semibold shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Code2 className="size-3.5" />
            <span>Source</span>
          </Button>
        </div>

        <Separator orientation="vertical" className="h-6 mx-1" />

        {/* Headings */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              type="button"
              variant={editor.isActive("paragraph") ? "secondary" : "ghost"}
              size="icon"
              disabled={isSourceMode || disabled}
              onClick={() => editor.chain().focus().setParagraph().run()}
              aria-label="Normal text"
              aria-pressed={editor.isActive("paragraph")}
              className="size-8"
            >
              <Pilcrow className="size-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Paragraph</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              type="button"
              variant={editor.isActive("heading", { level: 1 }) ? "secondary" : "ghost"}
              size="icon"
              disabled={isSourceMode || disabled}
              onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
              aria-label="Heading 1"
              aria-pressed={editor.isActive("heading", { level: 1 })}
              className="size-8 font-serif font-bold text-xs"
            >
              <Heading1 className="size-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Heading 1 (#)</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              type="button"
              variant={editor.isActive("heading", { level: 2 }) ? "secondary" : "ghost"}
              size="icon"
              disabled={isSourceMode || disabled}
              onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
              aria-label="Heading 2"
              aria-pressed={editor.isActive("heading", { level: 2 })}
              className="size-8 font-serif font-bold text-xs"
            >
              <Heading2 className="size-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Heading 2 (##)</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              type="button"
              variant={editor.isActive("heading", { level: 3 }) ? "secondary" : "ghost"}
              size="icon"
              disabled={isSourceMode || disabled}
              onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
              aria-label="Heading 3"
              aria-pressed={editor.isActive("heading", { level: 3 })}
              className="size-8 font-serif font-bold text-xs"
            >
              <Heading3 className="size-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Heading 3 (###)</TooltipContent>
        </Tooltip>

        <Separator orientation="vertical" className="h-6 mx-1" />

        {/* Inline Formatting */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              type="button"
              variant={editor.isActive("bold") ? "secondary" : "ghost"}
              size="icon"
              disabled={isSourceMode || disabled}
              onClick={() => editor.chain().focus().toggleBold().run()}
              aria-label="Bold (Ctrl+B)"
              aria-pressed={editor.isActive("bold")}
              className="size-8"
            >
              <Bold className="size-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Bold (Ctrl+B)</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              type="button"
              variant={editor.isActive("italic") ? "secondary" : "ghost"}
              size="icon"
              disabled={isSourceMode || disabled}
              onClick={() => editor.chain().focus().toggleItalic().run()}
              aria-label="Italic (Ctrl+I)"
              aria-pressed={editor.isActive("italic")}
              className="size-8"
            >
              <Italic className="size-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Italic (Ctrl+I)</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              type="button"
              variant={editor.isActive("strike") ? "secondary" : "ghost"}
              size="icon"
              disabled={isSourceMode || disabled}
              onClick={() => editor.chain().focus().toggleStrike().run()}
              aria-label="Strikethrough"
              aria-pressed={editor.isActive("strike")}
              className="size-8"
            >
              <Strikethrough className="size-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Strikethrough</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              type="button"
              variant={editor.isActive("code") ? "secondary" : "ghost"}
              size="icon"
              disabled={isSourceMode || disabled}
              onClick={() => editor.chain().focus().toggleCode().run()}
              aria-label="Inline Code (`)"
              aria-pressed={editor.isActive("code")}
              className="size-8"
            >
              <Code className="size-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Inline Code</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              type="button"
              variant={editor.isActive("link") ? "secondary" : "ghost"}
              size="icon"
              disabled={isSourceMode || disabled}
              onClick={handleOpenLinkDialog}
              aria-label="Add or edit link"
              aria-pressed={editor.isActive("link")}
              className="size-8"
            >
              <Link2 className="size-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Insert Link</TooltipContent>
        </Tooltip>

        {editor.isActive("link") && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                disabled={isSourceMode || disabled}
                onClick={() => editor.chain().focus().unsetLink().run()}
                aria-label="Remove link"
                className="size-8 text-destructive hover:bg-destructive/10"
              >
                <Unlink className="size-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Remove Link</TooltipContent>
          </Tooltip>
        )}

        <Separator orientation="vertical" className="h-6 mx-1" />

        {/* Lists & Blocks */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              type="button"
              variant={editor.isActive("bulletList") ? "secondary" : "ghost"}
              size="icon"
              disabled={isSourceMode || disabled}
              onClick={() => editor.chain().focus().toggleBulletList().run()}
              aria-label="Bullet List (-)"
              aria-pressed={editor.isActive("bulletList")}
              className="size-8"
            >
              <List className="size-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Bullet List</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              type="button"
              variant={editor.isActive("orderedList") ? "secondary" : "ghost"}
              size="icon"
              disabled={isSourceMode || disabled}
              onClick={() => editor.chain().focus().toggleOrderedList().run()}
              aria-label="Numbered List (1.)"
              aria-pressed={editor.isActive("orderedList")}
              className="size-8"
            >
              <ListOrdered className="size-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Numbered List</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              type="button"
              variant={editor.isActive("taskList") ? "secondary" : "ghost"}
              size="icon"
              disabled={isSourceMode || disabled}
              onClick={() => editor.chain().focus().toggleTaskList().run()}
              aria-label="Task List ([] )"
              aria-pressed={editor.isActive("taskList")}
              className="size-8"
            >
              <CheckSquare className="size-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Task List</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              type="button"
              variant={editor.isActive("blockquote") ? "secondary" : "ghost"}
              size="icon"
              disabled={isSourceMode || disabled}
              onClick={() => editor.chain().focus().toggleBlockquote().run()}
              aria-label="Blockquote (>)"
              aria-pressed={editor.isActive("blockquote")}
              className="size-8"
            >
              <Quote className="size-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Blockquote</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              type="button"
              variant={editor.isActive("codeBlock") ? "secondary" : "ghost"}
              size="icon"
              disabled={isSourceMode || disabled}
              onClick={() => editor.chain().focus().toggleCodeBlock().run()}
              aria-label="Code Block (```)"
              aria-pressed={editor.isActive("codeBlock")}
              className="size-8"
            >
              <FileCode className="size-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Code Block</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              disabled={isSourceMode || disabled}
              onClick={handleInsertTable}
              aria-label="Insert Table"
              className="size-8"
            >
              <TableIcon className="size-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Insert Table</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              disabled={isSourceMode || disabled}
              onClick={() => editor.chain().focus().setHorizontalRule().run()}
              aria-label="Horizontal Rule (---)"
              className="size-8"
            >
              <Minus className="size-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Divider (---)</TooltipContent>
        </Tooltip>

        <div className="ml-auto flex items-center gap-1">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                disabled={isSourceMode || !editor.can().undo()}
                onClick={() => editor.chain().focus().undo().run()}
                aria-label="Undo (Ctrl+Z)"
                className="size-8 text-muted-foreground"
              >
                <Undo className="size-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Undo (Ctrl+Z)</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                disabled={isSourceMode || !editor.can().redo()}
                onClick={() => editor.chain().focus().redo().run()}
                aria-label="Redo (Ctrl+Y)"
                className="size-8 text-muted-foreground"
              >
                <Redo className="size-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Redo (Ctrl+Y)</TooltipContent>
          </Tooltip>
        </div>
      </div>

      {/* Editor Surface */}
      <div className="relative flex-1 bg-background">
        {isSourceMode ? (
          <Textarea
            value={sourceContent}
            onChange={handleSourceChange}
            placeholder={placeholder}
            disabled={disabled}
            rows={22}
            className="w-full resize-none font-mono text-sm leading-relaxed p-5 sm:p-7 border-none rounded-none focus-visible:ring-0 bg-transparent min-h-[450px]"
            aria-label="Raw Markdown source editor"
          />
        ) : (
          <EditorContent editor={editor} className="min-h-[450px]" />
        )}
      </div>

      {/* Link Insertion Dialog */}
      <Dialog open={linkDialogOpen} onOpenChange={setLinkDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <form onSubmit={handleSetLink}>
            <DialogHeader>
              <DialogTitle>Insert Link</DialogTitle>
              <DialogDescription>
                Enter the web URL for the link. URLs starting with http:// or https:// will open in a new tab.
              </DialogDescription>
            </DialogHeader>

            <div className="my-4 flex flex-col gap-2">
              <Label htmlFor="link-url">URL</Label>
              <Input
                id="link-url"
                type="text"
                placeholder="https://example.com"
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                autoFocus
              />
            </div>

            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                type="button"
                variant="outline"
                onClick={() => setLinkDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" className="bg-accent-solid text-white hover:bg-accent-solid/90">
                Save Link
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
