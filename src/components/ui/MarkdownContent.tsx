import ReactMarkdown from 'react-markdown'

interface Props {
  text: string
  className?: string
  size?: 'sm' | 'md'
}

export default function MarkdownContent({ text, className = '', size = 'md' }: Props) {
  const base = size === 'sm' ? 'text-[13px]' : 'text-[14px]'
  return (
    <div className={`${base} leading-relaxed text-ink ${className}`}>
    <ReactMarkdown
      components={{
        p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
        strong: ({ children }) => <strong className="font-semibold text-ink">{children}</strong>,
        em: ({ children }) => <em className="italic">{children}</em>,
        ul: ({ children }) => <ul className="mb-2 space-y-1 pl-4 last:mb-0" style={{ listStyleType: 'disc' }}>{children}</ul>,
        ol: ({ children }) => <ol className="mb-2 space-y-1 pl-4 last:mb-0" style={{ listStyleType: 'decimal' }}>{children}</ol>,
        li: ({ children }) => <li>{children}</li>,
        h1: ({ children }) => <h1 className="mb-1 text-[16px] font-bold">{children}</h1>,
        h2: ({ children }) => <h2 className="mb-1 text-[15px] font-bold">{children}</h2>,
        h3: ({ children }) => <h3 className="mb-1 text-[14px] font-semibold">{children}</h3>,
        code: ({ children }) => <code className="rounded bg-gray-100 px-1 py-0.5 font-mono text-[12px]">{children}</code>,
        hr: () => <hr className="my-2 border-border" />,
      }}
    >
      {text}
    </ReactMarkdown>
    </div>
  )
}
