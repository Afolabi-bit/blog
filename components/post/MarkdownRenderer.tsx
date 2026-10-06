"use client";

import React, { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeSanitize from "rehype-sanitize";
import { Check, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";

interface MarkdownRendererProps {
  content: string;
}

function CodeBlock({ children, className }: { children: React.ReactNode; className?: string }) {
  const [copied, setCopied] = useState(false);

  // Extract raw text from children for copying
  const extractText = (node: React.ReactNode): string => {
    if (typeof node === "string") return node;
    if (typeof node === "number") return String(node);
    if (Array.isArray(node)) return node.map(extractText).join("");
    if (React.isValidElement<{ children?: React.ReactNode }>(node)) {
      return extractText(node.props.children);
    }
    return "";
  };

  const handleCopy = async () => {
    try {
      const text = extractText(children);
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
    }
  };

  const match = /language-(\w+)/.exec(className || "");
  const lang = match ? match[1] : "";

  return (
    <div className="relative group/code my-6 rounded-xl border border-border bg-card overflow-hidden shadow-2xs">
      <div className="flex items-center justify-between border-b border-border/50 bg-muted/40 px-4 py-1.5 text-xs text-muted-foreground font-mono">
        <span>{lang || "code"}</span>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={handleCopy}
          aria-label={copied ? "Code copied to clipboard" : "Copy code"}
          aria-pressed={copied}
          className="h-7 px-2 text-xs gap-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted"
        >
          {copied ? (
            <>
              <Check className="size-3.5 text-status-success" />
              <span>Copied</span>
            </>
          ) : (
            <>
              <Copy className="size-3.5" />
              <span>Copy</span>
            </>
          )}
        </Button>
      </div>
      <pre className="p-4 overflow-x-auto font-mono text-sm leading-relaxed text-card-foreground">
        <code className={className}>{children}</code>
      </pre>
    </div>
  );
}

export function MarkdownRenderer({ content }: MarkdownRendererProps) {
  return (
    <div className="article-body prose-bloggr">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeSanitize]}
        components={{
          // Demote h1 in content to h2 per M1.2 & better-accessibility (single <h1> per page)
          h1: ({ children }) => (
            <h2 className="mt-10 mb-4 border-b border-border/50 pb-2 font-serif text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              {children}
            </h2>
          ),
          h2: ({ children }) => (
            <h2 className="mt-9 mb-4 border-b border-border/50 pb-2 font-serif text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              {children}
            </h2>
          ),
          h3: ({ children }) => (
            <h3 className="mt-7 mb-3 font-serif text-xl font-bold tracking-tight text-foreground sm:text-2xl">
              {children}
            </h3>
          ),
          h4: ({ children }) => (
            <h4 className="mt-6 mb-2 font-serif text-lg font-semibold tracking-tight text-foreground">
              {children}
            </h4>
          ),
          p: ({ children }) => (
            <p className="my-5 font-serif text-[18px] leading-[1.8] text-foreground/90 sm:text-[19px]">
              {children}
            </p>
          ),
          blockquote: ({ children }) => (
            <blockquote className="my-6 border-l-2 border-border pl-5 py-1 italic text-muted-foreground bg-muted/20 rounded-r-md">
              {children}
            </blockquote>
          ),
          ul: ({ children }) => (
            <ul className="my-5 pl-6 list-disc flex flex-col gap-2 font-serif text-[18px] leading-relaxed text-foreground/90">
              {children}
            </ul>
          ),
          ol: ({ children }) => (
            <ol className="my-5 pl-6 list-decimal flex flex-col gap-2 font-serif text-[18px] leading-relaxed text-foreground/90">
              {children}
            </ol>
          ),
          li: ({ children }) => <li className="pl-1">{children}</li>,
          hr: () => <hr className="my-8 border-border/60" />,
          a: ({ href, children }) => (
            <a
              href={href}
              target={href?.startsWith("http") ? "_blank" : undefined}
              rel={href?.startsWith("http") ? "noopener noreferrer" : undefined}
              className="font-medium text-accent-solid underline underline-offset-4 transition-opacity hover:opacity-85"
            >
              {children}
            </a>
          ),
          pre: ({ children }) => {
            // When pre contains code block, let code renderer handle it or render directly
            return <>{children}</>;
          },
          code: ({ className, children }) => {
            const isBlock = className?.includes("language-") || (typeof children === "string" && children.includes("\n"));
            if (isBlock) {
              return <CodeBlock className={className}>{children}</CodeBlock>;
            }
            return (
              <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-[0.875em] font-medium text-foreground">
                {children}
              </code>
            );
          },
          table: ({ children }) => (
            <div className="my-6 overflow-x-auto">
              <table className="w-full border-collapse border border-border text-left text-sm">
                {children}
              </table>
            </div>
          ),
          th: ({ children }) => (
            <th className="border border-border bg-muted/60 px-4 py-2.5 font-semibold text-foreground">
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td className="border border-border px-4 py-2 text-foreground/90">
              {children}
            </td>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
