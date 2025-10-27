import ReactMarkdown from 'react-markdown';
import { Components } from 'react-markdown';
import { CodeBlock } from './CodeBlock';

interface MarkdownMessageProps {
  content: string;
  isStreaming?: boolean;
}

export const MarkdownMessage = ({ content, isStreaming = false }: MarkdownMessageProps) => {
  const components: Components = {
    code({ node, className, children, ...props }) {
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
    p({ children }) {
      return <p className="mb-2 last:mb-0 leading-relaxed text-sm sm:text-base">{children}</p>;
    },
    ul({ children }) {
      return <ul className="list-disc list-inside mb-2 space-y-1 text-sm sm:text-base">{children}</ul>;
    },
    ol({ children }) {
      return <ol className="list-decimal list-inside mb-2 space-y-1 text-sm sm:text-base">{children}</ol>;
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
  };

  return (
    <div className="markdown-content">
      <ReactMarkdown components={components}>
        {content}
      </ReactMarkdown>
      {isStreaming && (
        <span className="inline-block w-1.5 h-4 sm:h-5 bg-primary ml-0.5 animate-pulse" />
      )}
    </div>
  );
};
