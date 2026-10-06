import React, { useState } from 'react';
import { Copy, Check, Terminal } from 'lucide-react';

function renderInlineFormatting(text: string): React.ReactNode[] {
  // Support **bold**, `inline code`, and [Page X] or [Source X] citation highlights
  const parts = text.split(/(\*\*.*?\*\*|`[^`]+`|\[(?:Page|Source)[^\]]+\])/g);
  return parts.map((part, idx) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return (
        <strong key={idx} className="font-semibold text-slate-900">
          {part.slice(2, -2)}
        </strong>
      );
    }
    if (part.startsWith('`') && part.endsWith('`')) {
      return (
        <code
          key={idx}
          className="px-1.5 py-0.5 rounded-md bg-indigo-50/80 text-indigo-900 font-mono text-[11px] border border-indigo-100/80"
        >
          {part.slice(1, -1)}
        </code>
      );
    }
    if (/^\[(?:Page|Source)[^\]]+\]$/.test(part)) {
      return (
        <span
          key={idx}
          className="inline-flex items-center px-1.5 py-0.5 mx-0.5 rounded-md bg-sky-50 text-sky-800 border border-sky-200/80 font-mono text-[11px] font-medium"
        >
          {part}
        </span>
      );
    }
    return <span key={idx}>{part}</span>;
  });
}

const CodeBlock: React.FC<{ code: string }> = ({ code }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard?.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  return (
    <div className="my-3.5 rounded-xl overflow-hidden border border-slate-800 bg-slate-950 shadow-sm">
      <div className="flex items-center justify-between px-3.5 py-2 bg-slate-900/90 border-b border-slate-800 text-[11px] text-slate-400 font-mono">
        <span className="flex items-center gap-1.5">
          <Terminal className="w-3 h-3 text-indigo-400" />
          <span>Code Snippet</span>
        </span>
        <button
          type="button"
          onClick={handleCopy}
          className="flex items-center gap-1 text-slate-400 hover:text-white transition-colors"
        >
          {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
          <span>{copied ? 'Copied' : 'Copy'}</span>
        </button>
      </div>
      <pre className="p-4 text-slate-100 text-xs font-mono overflow-x-auto leading-relaxed">
        <code>{code}</code>
      </pre>
    </div>
  );
};

export const MarkdownRenderer: React.FC<{ content: string; className?: string }> = ({
  content,
  className = '',
}) => {
  if (!content) return null;
  const lines = content.split('\n');
  const elements: React.ReactNode[] = [];
  let inCodeBlock = false;
  let codeLines: string[] = [];

  lines.forEach((rawLine, index) => {
    const line = rawLine.trimEnd();

    if (line.startsWith('```')) {
      if (inCodeBlock) {
        elements.push(<CodeBlock key={`code-${index}`} code={codeLines.join('\n')} />);
        codeLines = [];
        inCodeBlock = false;
      } else {
        inCodeBlock = true;
      }
      return;
    }

    if (inCodeBlock) {
      codeLines.push(rawLine);
      return;
    }

    if (line === '') {
      elements.push(<div key={`space-${index}`} className="h-2" />);
    } else if (line.startsWith('# ')) {
      elements.push(
        <h1
          key={index}
          className="text-xl font-bold text-slate-900 mt-4 mb-2 font-display tracking-tight"
        >
          {line.slice(2)}
        </h1>
      );
    } else if (line.startsWith('## ')) {
      elements.push(
        <h2
          key={index}
          className="text-base font-bold text-slate-900 mt-5 mb-2 pb-1.5 border-b border-slate-100"
        >
          {line.slice(3)}
        </h2>
      );
    } else if (line.startsWith('### ')) {
      elements.push(
        <h3 key={index} className="text-sm font-semibold text-slate-800 mt-3.5 mb-1">
          {line.slice(4)}
        </h3>
      );
    } else if (line.startsWith('#### ')) {
      elements.push(
        <h4 key={index} className="text-xs font-semibold text-indigo-700 mt-3 mb-1">
          {line.slice(5)}
        </h4>
      );
    } else if (line.startsWith('> ')) {
      elements.push(
        <blockquote
          key={index}
          className="border-l-2 border-indigo-500 pl-3.5 py-1.5 my-2 text-xs italic text-slate-600 bg-indigo-50/40 rounded-r-lg"
        >
          {renderInlineFormatting(line.slice(2))}
        </blockquote>
      );
    } else if (line.startsWith('- ') || line.startsWith('* ')) {
      elements.push(
        <div key={index} className="flex items-start gap-2.5 pl-1 my-1 text-[13px] text-slate-700 leading-relaxed">
          <span className="text-indigo-500 mt-1.5 text-[9px]">●</span>
          <span className="flex-1">{renderInlineFormatting(line.slice(2))}</span>
        </div>
      );
    } else if (/^\d+\.\s/.test(line)) {
      const match = line.match(/^(\d+\.)\s(.*)$/);
      if (match) {
        elements.push(
          <div key={index} className="flex items-start gap-2 pl-1 my-1 text-[13px] text-slate-700 leading-relaxed">
            <span className="font-mono text-xs font-semibold text-indigo-600 shrink-0 mt-0.5 tabular-nums">
              {match[1]}
            </span>
            <span className="flex-1">{renderInlineFormatting(match[2])}</span>
          </div>
        );
      }
    } else if (line === '---') {
      elements.push(<hr key={index} className="my-4 border-slate-200" />);
    } else {
      elements.push(
        <p key={index} className="text-[13px] text-slate-700 leading-relaxed my-1">
          {renderInlineFormatting(line)}
        </p>
      );
    }
  });

  return <div className={`space-y-0.5 ${className}`}>{elements}</div>;
};
