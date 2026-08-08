'use client'

import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeRaw from 'rehype-raw'
import type { Components } from 'react-markdown'

interface Props {
  text: string
  className?: string
  size?: 'sm' | 'md'
}

const components: Components = {
  p: ({ children, ...props }) => (
    <p {...props} className="ai-fade">
      {children}
    </p>
  ),
  li: ({ children, ...props }) => (
    <li {...props} className="ai-fade">
      {children}
    </li>
  ),
  h1: ({ children, ...props }) => (
    <h1 {...props} className="ai-fade">
      {children}
    </h1>
  ),
  h2: ({ children, ...props }) => (
    <h2 {...props} className="ai-fade">
      {children}
    </h2>
  ),
  h3: ({ children, ...props }) => (
    <h3 {...props} className="ai-fade">
      {children}
    </h3>
  ),
  blockquote: ({ children, ...props }) => (
    <blockquote {...props} className="ai-fade">
      {children}
    </blockquote>
  ),
  pre: ({ children, ...props }) => (
    <pre {...props} className="ai-fade">
      {children}
    </pre>
  ),
  table: ({ children, ...props }) => (
    <div className="ai-fade overflow-x-auto">
      <table {...props}>{children}</table>
    </div>
  ),
  tr: ({ children, ...props }) => (
    <tr {...props} className="ai-fade">
      {children}
    </tr>
  ),
}

export default function MarkdownContent({ text, className = '', size = 'md' }: Props) {
  const prose =
    size === 'sm'
      ? 'prose prose-sm max-w-none prose-p:my-1.5 prose-li:my-0.5 prose-headings:mt-3 prose-headings:mb-1'
      : 'prose prose-base max-w-none prose-p:my-2 prose-li:my-1 prose-headings:mt-4 prose-headings:mb-1.5'

  return (
    <div
      className={[
        prose,
        'prose-headings:text-ink prose-headings:font-bold',
        'prose-p:text-ink prose-p:leading-relaxed',
        'prose-li:text-ink',
        'prose-strong:text-ink prose-strong:font-semibold',
        'prose-em:text-ink2',
        'prose-a:text-primary prose-a:no-underline hover:prose-a:underline',
        'prose-code:text-ink prose-code:bg-bg2 prose-code:rounded prose-code:px-1 prose-code:py-0.5 prose-code:text-[0.85em] prose-code:font-normal',
        'prose-pre:bg-bg2 prose-pre:border prose-pre:border-border prose-pre:rounded-xl',
        'prose-blockquote:border-l-primary prose-blockquote:text-ink2',
        'prose-hr:border-border',
        'prose-table:w-full prose-th:text-ink prose-td:text-ink',
        className,
      ].join(' ')}
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeRaw]}
        components={components}
      >
        {text}
      </ReactMarkdown>
    </div>
  )
}
