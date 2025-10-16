import ReactMarkdown from 'react-markdown';
import { Components } from 'react-markdown';
import { CodeBlock } from './CodeBlock';

interface MarkdownMessageProps {
  content: string;
}

export const MarkdownMessage = ({ content }: MarkdownMessageProps) => {
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
      return <p className="mb-2 last:mb-0 leading-relaxed">{children}</p>;
    },
    ul({ children }) {
      return <ul className="list-disc list-inside mb-2 space-y-1">{children}</ul>;
    },
    ol({ children }) {
      return <ol className="list-decimal list-inside mb-2 space-y-1">{children}</ol>;
    },
  };

  return (
    <ReactMarkdown components={components}>
      {content}
    </ReactMarkdown>
  );
};
