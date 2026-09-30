import React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeSanitize from "rehype-sanitize";

interface MarkdownRendererProps {
  content: string;
}

export function MarkdownRenderer({ content }: MarkdownRendererProps) {
  return (
    <div className="article-body">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeSanitize]}
        components={{
          h1: ({ children }) => (
            <h1 className="mt-10 mb-4 font-serif text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              {children}
            </h1>
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
            <blockquote className="my-6 border-l-4 border-accent-solid pl-5 py-1 italic text-muted-foreground bg-muted/30 rounded-r-md">
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
          code: ({ className, children }) => {
            const isBlock = className?.includes("language-");
            if (isBlock) {
              return (
                <code className="font-mono text-sm text-foreground">
                  {children}
                </code>
              );
            }
            return (
              <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-[0.875em] font-medium text-foreground">
                {children}
              </code>
            );
          },
          pre: ({ children }) => (
            <pre className="my-6 overflow-x-auto rounded-xl border border-border bg-card p-4 font-mono text-sm leading-relaxed text-card-foreground shadow-xs">
              {children}
            </pre>
          ),
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
