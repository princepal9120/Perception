import ReactMarkdown from 'react-markdown';
import { Components } from 'react-markdown';
import { CodeBlock } from './CodeBlock';
import { ExternalLink } from 'lucide-react';
import { memo } from 'react';

interface MarkdownMessageProps {
  content: string;
  isStreaming?: boolean;
}

export const MarkdownMessage = memo(({ content, isStreaming = false }: MarkdownMessageProps) => {
  const components: Components = {
    code({ className, children, ...props }) {
      const match = /language-(\w+)/.exec(className || '');
      const codeContent = String(children).replace(/\n$/, '');
      const isInline = !className && !codeContent.includes('\n');

      return !isInline && match ? (
        <CodeBlock language={match[1]} code={codeContent} />
      ) : (
        <code
          className="bg-muted px-1.5 py-0.5 rounded text-sm font-mono"
          {...props}
        >
          {children}
        </code>
      );
    },
    // Links with proper styling and external indicator
    a({ href, children }) {
      const isExternal = href?.startsWith('http');
      return (
        <a
          href={href}
          target={isExternal ? '_blank' : undefined}
          rel={isExternal ? 'noopener noreferrer' : undefined}
          className="text-primary hover:text-primary/80 underline underline-offset-2 decoration-primary/30 hover:decoration-primary/60 transition-colors inline-flex items-center gap-0.5"
        >
          {children}
          {isExternal && <ExternalLink className="w-3 h-3 inline-block ml-0.5" />}
        </a>
      );
    },
    p({ children }) {
      return <p className="mb-2 last:mb-0 leading-relaxed text-sm sm:text-base">{children}</p>;
    },
    ul({ children }) {
      return <ul className="list-disc list-inside mb-2 space-y-1 text-sm sm:text-base">{children}</ul>;
    },
    ol({ children }) {
      return <ol className="list-decimal list-inside mb-2 space-y-1 text-sm sm:text-base">{children}</ol>;
    },
    li({ children }) {
      return <li className="text-sm sm:text-base">{children}</li>;
    },
    h1({ children }) {
      return <h1 className="text-xl sm:text-2xl font-bold mb-3 mt-4 first:mt-0">{children}</h1>;
    },
    h2({ children }) {
      return <h2 className="text-lg sm:text-xl font-semibold mb-2 mt-3 first:mt-0">{children}</h2>;
    },
    h3({ children }) {
      return <h3 className="text-base sm:text-lg font-semibold mb-2 mt-3 first:mt-0">{children}</h3>;
    },
    blockquote({ children }) {
      return (
        <blockquote className="border-l-4 border-primary/30 pl-4 py-1 my-2 italic text-muted-foreground">
          {children}
        </blockquote>
      );
    },
    // Tables
    table({ children }) {
      return (
        <div className="overflow-x-auto my-3">
          <table className="min-w-full border-collapse border border-border text-sm">
            {children}
          </table>
        </div>
      );
    },
    th({ children }) {
      return <th className="border border-border bg-muted px-3 py-2 text-left font-semibold">{children}</th>;
    },
    td({ children }) {
      return <td className="border border-border px-3 py-2">{children}</td>;
    },
    // Horizontal rule
    hr() {
      return <hr className="my-4 border-border" />;
    },
    // Strong/Bold
    strong({ children }) {
      return <strong className="font-semibold">{children}</strong>;
    },
    // Emphasis/Italic
    em({ children }) {
      return <em className="italic">{children}</em>;
    },
  };

  return (
    <div className="markdown-content">
      <ReactMarkdown components={components}>
        {content}
      </ReactMarkdown>
      {isStreaming && (
        <span className="inline-block w-1.5 h-4 sm:h-5 bg-primary ml-0.5 animate-pulse" aria-label="Generating response" />
      )}
    </div>
  );
});

MarkdownMessage.displayName = 'MarkdownMessage';
