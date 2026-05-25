import ReactMarkdown from 'react-markdown';
import type { Components } from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { Copy, Check, Terminal } from 'lucide-react';
import { useState, type ReactNode } from 'react';
import { playClick } from '../lib/sound';

interface MarkdownRendererProps {
  content: string;
}

const TERMINAL_THEME = {
  ...oneDark,
  'pre[class*="language-"]': {
    ...oneDark['pre[class*="language-"]'],
    background: '#0a0a18',
    border: '1px solid rgba(0,229,255,0.08)',
    borderRadius: '0',
  },
  'code[class*="language-"]': {
    ...oneDark['code[class*="language-"]'],
    background: 'transparent',
  },
};

function CodeBlock({
  className,
  children,
  ...props
}: {
  className?: string;
  children?: ReactNode;
  [key: string]: unknown;
}) {
  const match = /language-(\w+)/.exec(className ?? '');
  const language = match?.[1] ?? '';
  const code = String(children).replace(/\n$/, '');
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    playClick();
    setTimeout(() => setCopied(false), 2000);
  };

  if (!match) {
    return (
      <code className={`${className ?? ''} bg-cyan-500/10 text-cyan-400 rounded-md px-1.5 py-0.5`} {...props}>
        {children}
      </code>
    );
  }

  return (
    <div className="relative group rounded-lg overflow-hidden border border-cyan-500/10 my-3 shadow-[0_0_12px_rgba(0,229,255,0.03)]">
      {/* Terminal header bar */}
      <div className="flex items-center justify-between px-4 py-2 bg-[#0a0a18] border-b border-white/[0.04]">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-red-500/60" />
            <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/60" />
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/60" />
          </div>
          <span className="text-xs text-gray-500 font-mono ml-2 flex items-center gap-1.5">
            <Terminal className="w-3 h-3 text-emerald-400/60" />
            {language || 'code'}
          </span>
        </div>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1 px-2 py-1 rounded text-xs text-gray-500 hover:text-cyan-400 hover:bg-white/[0.04] transition-all"
          title="复制代码"
        >
          {copied ? (
            <>
              <Check className="w-3 h-3 text-emerald-400" />
              <span className="text-emerald-400">已复制</span>
            </>
          ) : (
            <>
              <Copy className="w-3 h-3" />
              复制
            </>
          )}
        </button>
      </div>
      {/* Code body */}
      <SyntaxHighlighter
        style={TERMINAL_THEME}
        language={language}
        PreTag="div"
        customStyle={{
          margin: 0,
          borderRadius: 0,
          background: '#0a0a18',
          padding: '1rem',
        }}
      >
        {code}
      </SyntaxHighlighter>
    </div>
  );
}

export function MarkdownRenderer({ content }: MarkdownRendererProps) {
  return (
    <div className="message-content">
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[rehypeKatex]}
        components={{
          code: CodeBlock as Components['code'],
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
