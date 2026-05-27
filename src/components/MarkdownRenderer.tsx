import ReactMarkdown from 'react-markdown';
import type { Components } from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { Copy, Check, Terminal } from 'lucide-react';
import { useState, useEffect, useRef, type ReactNode } from 'react';
import { playClick } from '../lib/sound';

/** Mermaid diagram renderer - loads mermaid dynamically */
function MermaidBlock({ code }: { code: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [svg, setSvg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function render() {
      try {
        // Dynamically load mermaid
        if (!(window as unknown as Record<string, unknown>).mermaid) {
          const script = document.createElement('script');
          script.src = 'https://cdnjs.cloudflare.com/ajax/libs/mermaid/11.4.1/mermaid.min.js';
          if (!document.querySelector(`script[src="${script.src}"]`)) {
            await new Promise<void>((resolve, reject) => {
              script.onload = () => resolve();
              script.onerror = () => reject(new Error('mermaid load failed'));
              document.head.appendChild(script);
            });
          }
        }

        const mermaid = (window as unknown as Record<string, { render: (id: string, code: string) => Promise<{ svg: string }> }>).mermaid;
        if (!mermaid) return;
        const id = `mermaid-${Math.random().toString(36).slice(2, 8)}`;
        const result = await mermaid.render(id, code);
        if (!cancelled) setSvg(result.svg);
      } catch (e: unknown) {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Mermaid render failed');
      }
    }
    render();
    return () => { cancelled = true; };
  }, [code]);

  if (error) {
    return (
      <div className="my-3 p-3 rounded-lg bg-red-500/[0.06] border border-red-500/10 text-xs text-red-400 font-mono">
        Mermaid error: {error}
      </div>
    );
  }

  if (svg) {
    return (
      <div
        className="my-3 p-4 rounded-lg bg-[#0a0a18] border border-white/[0.04] overflow-x-auto"
        dangerouslySetInnerHTML={{ __html: svg }}
      />
    );
  }

  return (
    <div className="my-3 p-4 rounded-lg border border-cyan-500/10 bg-cyan-500/[0.02] text-xs text-gray-500 animate-pulse">
      正在渲染图表...
    </div>
  );
}

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
          pre: ((props: Record<string, unknown>) => {
            const children = props.children as ReactNode;
            // Detect mermaid code blocks
            const codeEl = (children as unknown as { props?: { className?: string; children?: string } })?.props;
            const lang = /language-(\w+)/.exec(codeEl?.className ?? '')?.[1];
            if (lang === 'mermaid' && codeEl?.children) {
              return <MermaidBlock code={codeEl.children} />;
            }
            return <pre {...(props as Record<string, unknown>)}>{children}</pre>;
          }) as Components['pre'],
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
