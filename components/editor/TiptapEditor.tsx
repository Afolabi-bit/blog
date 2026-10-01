"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import { BubbleMenu } from "@tiptap/react/menus";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import TaskList from "@tiptap/extension-task-list";
import TaskItem from "@tiptap/extension-task-item";
import Placeholder from "@tiptap/extension-placeholder";
import { Table, TableRow, TableCell, TableHeader } from "@tiptap/extension-table";
import { Markdown } from "tiptap-markdown";
import axios from "axios";
import { toast } from "sonner";
import { mediaEndpoints } from "@/lib/endpoints";
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
  Image as ImageIcon,
  UploadCloud,
  Loader2,
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

  const [imageDialogOpen, setImageDialogOpen] = useState(false);
  const [imageUrl, setImageUrl] = useState("");
  const [imageAlt, setImageAlt] = useState("");
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const imageFileInputRef = useRef<HTMLInputElement>(null);

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
      Placeholder.configure({
        placeholder: "Start writing…",
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

  // Escape key dismisses active selection / bubble menu
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && editor && editor.isFocused) {
        window.getSelection()?.removeAllRanges();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [editor]);

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

  const handleRemoveLink = () => {
    if (!editor) return;
    editor.chain().focus().extendMarkRange("link").unsetLink().run();
    setLinkDialogOpen(false);
  };

  const handleInsertTable = () => {
    if (!editor) return;
    editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run();
  };

  const handleInsertImage = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!editor || !imageUrl.trim()) return;
    editor
      .chain()
      .focus()
      .setImage({ src: imageUrl.trim(), alt: imageAlt.trim() || undefined })
      .run();
    setImageUrl("");
    setImageAlt("");
    setImageDialogOpen(false);
  };

  const handleImageFileUpload = async (file: File) => {
    const validTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    if (!validTypes.includes(file.type)) {
      toast.error("Please upload a JPG, PNG, WEBP, or GIF image.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image file is too large (maximum 5MB).");
      return;
    }

    setIsUploadingImage(true);
    const toastId = toast.loading("Uploading image to storage…");
    try {
      const res = await mediaEndpoints.upload(file);
      if (res.status === "success" && res.data?.url) {
        if (editor) {
          editor
            .chain()
            .focus()
            .setImage({
              src: res.data.url,
              alt: imageAlt.trim() || file.name,
            })
            .run();
        }
        toast.success("Image uploaded and inserted!", { id: toastId });
        setImageUrl("");
        setImageAlt("");
        setImageDialogOpen(false);
      } else {
        toast.error(res.message || "Failed to upload image", { id: toastId });
      }
    } catch (err: unknown) {
      let msg = "Failed to upload image";
      if (axios.isAxiosError(err)) {
        msg = err.response?.data?.message || err.message || msg;
      }
      toast.error(msg, { id: toastId });
    } finally {
      setIsUploadingImage(false);
    }
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
        aria-label="Text formatting"
        className="flex flex-wrap items-center gap-1 border-b border-border/60 bg-muted/40 p-2 sm:gap-1.5 max-sm:fixed max-sm:bottom-0 max-sm:left-0 max-sm:right-0 max-sm:z-40 max-sm:border-t max-sm:border-border max-sm:bg-background/95 max-sm:backdrop-blur-md max-sm:p-2 max-sm:shadow-lg max-sm:overflow-x-auto max-sm:flex-nowrap"
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

        {editor.isActive("codeBlock") && (
          <div className="flex items-center gap-1.5 px-1">
            <label htmlFor="lang-select" className="text-xs font-mono text-muted-foreground">
              Language
            </label>
            <select
              id="lang-select"
              aria-label="Language"
              value={editor.getAttributes("codeBlock").language || "text"}
              onChange={(e) =>
                editor
                  .chain()
                  .focus()
                  .updateAttributes("codeBlock", { language: e.target.value })
                  .run()
              }
              className="h-7 rounded-md border border-border bg-background px-2 py-0.5 font-mono text-xs text-foreground focus:outline-hidden focus:ring-1 focus:ring-accent-solid"
            >
              <option value="text">text</option>
              <option value="typescript">typescript</option>
              <option value="javascript">javascript</option>
              <option value="go">go</option>
              <option value="python">python</option>
              <option value="rust">rust</option>
              <option value="html">html</option>
              <option value="css">css</option>
              <option value="json">json</option>
              <option value="bash">bash</option>
              <option value="sql">sql</option>
              <option value="markdown">markdown</option>
            </select>
          </div>
        )}

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              disabled={isSourceMode || disabled}
              onClick={() => setImageDialogOpen(true)}
              aria-label="Insert Image"
              className="size-8"
            >
              <ImageIcon className="size-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Insert Image</TooltipContent>
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
        {!isSourceMode && editor && (
          <BubbleMenu
            editor={editor}
            className="flex items-center gap-0.5 rounded-lg border border-border bg-popover/95 p-1 shadow-lg text-popover-foreground backdrop-blur-xs"
          >
            <Button
              type="button"
              variant={editor.isActive("bold") ? "secondary" : "ghost"}
              size="sm"
              onClick={() => editor.chain().focus().toggleBold().run()}
              aria-label="Bold (Ctrl+B)"
              aria-pressed={editor.isActive("bold")}
              className="size-7 p-0"
            >
              <Bold className="size-3.5" />
            </Button>
            <Button
              type="button"
              variant={editor.isActive("italic") ? "secondary" : "ghost"}
              size="sm"
              onClick={() => editor.chain().focus().toggleItalic().run()}
              aria-label="Italic (Ctrl+I)"
              aria-pressed={editor.isActive("italic")}
              className="size-7 p-0"
            >
              <Italic className="size-3.5" />
            </Button>
            <Button
              type="button"
              variant={editor.isActive("strike") ? "secondary" : "ghost"}
              size="sm"
              onClick={() => editor.chain().focus().toggleStrike().run()}
              aria-label="Strikethrough"
              aria-pressed={editor.isActive("strike")}
              className="size-7 p-0"
            >
              <Strikethrough className="size-3.5" />
            </Button>
            <Button
              type="button"
              variant={editor.isActive("code") ? "secondary" : "ghost"}
              size="sm"
              onClick={() => editor.chain().focus().toggleCode().run()}
              aria-label="Inline Code"
              aria-pressed={editor.isActive("code")}
              className="size-7 p-0"
            >
              <Code className="size-3.5" />
            </Button>
            <Button
              type="button"
              variant={editor.isActive("link") ? "secondary" : "ghost"}
              size="sm"
              onClick={handleOpenLinkDialog}
              aria-label="Link (Ctrl+K)"
              aria-pressed={editor.isActive("link")}
              className="size-7 p-0"
            >
              <Link2 className="size-3.5" />
            </Button>
          </BubbleMenu>
        )}

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
              <DialogTitle>Add link</DialogTitle>
              <DialogDescription>
                Enter the destination web URL for this link.
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
                aria-label="URL"
                autoFocus
              />
            </div>

            <DialogFooter className="flex items-center justify-between sm:justify-between w-full">
              {editor?.isActive("link") ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleRemoveLink}
                  className="text-destructive hover:text-destructive hover:bg-destructive/10 text-xs"
                >
                  Remove link
                </Button>
              ) : <div />}
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setLinkDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" size="sm" className="bg-accent-solid text-white hover:bg-accent-solid/90">
                  Add link
                </Button>
              </div>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Image Insertion Dialog (RTE-7) */}
      <Dialog open={imageDialogOpen} onOpenChange={setImageDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <form onSubmit={handleInsertImage}>
            <DialogHeader>
              <DialogTitle>Insert Image</DialogTitle>
              <DialogDescription>
                Upload an image or paste a URL to insert directly into your story.
              </DialogDescription>
            </DialogHeader>

            <div className="my-4 flex flex-col gap-4">
              {/* File upload dropzone */}
              <div
                onClick={() => !isUploadingImage && imageFileInputRef.current?.click()}
                className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-border rounded-xl hover:border-accent-solid/50 cursor-pointer bg-muted/20 transition-colors"
              >
                <input
                  ref={imageFileInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/gif"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleImageFileUpload(file);
                  }}
                  disabled={isUploadingImage}
                />
                {isUploadingImage ? (
                  <div className="flex flex-col items-center gap-2">
                    <Loader2 className="size-6 animate-spin text-accent-solid" />
                    <p className="text-xs text-muted-foreground">Uploading image to storage…</p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-1.5 text-center">
                    <UploadCloud className="size-6 text-muted-foreground" />
                    <p className="text-xs font-medium text-foreground">Click to upload image</p>
                    <p className="text-[10px] text-muted-foreground">PNG, JPG, WEBP, GIF up to 5MB</p>
                  </div>
                )}
              </div>

              <div className="relative flex items-center justify-center">
                <span className="bg-background px-2 text-[10px] text-muted-foreground uppercase font-mono tracking-wider">
                  Or enter URL
                </span>
                <div className="absolute inset-0 -z-10 flex items-center">
                  <div className="w-full border-t border-border/60" />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="image-url" className="text-xs">Image URL</Label>
                <Input
                  id="image-url"
                  type="text"
                  placeholder="https://example.com/photo.jpg"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  disabled={isUploadingImage}
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="image-alt" className="text-xs">Alt Text (Accessibility description)</Label>
                <Input
                  id="image-alt"
                  type="text"
                  placeholder="Descriptive label for screen readers"
                  value={imageAlt}
                  onChange={(e) => setImageAlt(e.target.value)}
                  disabled={isUploadingImage}
                />
              </div>
            </div>

            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                type="button"
                variant="outline"
                onClick={() => setImageDialogOpen(false)}
                disabled={isUploadingImage}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={!imageUrl.trim() || isUploadingImage}
                className="bg-accent-solid text-white hover:bg-accent-solid/90"
              >
                Insert Image
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
