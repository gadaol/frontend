import ReactMarkdown from 'react-markdown'

interface Props {
  text: string
  className?: string
  size?: 'sm' | 'md'
}

export default function MarkdownContent({ text, className = '', size = 'md' }: Props) {
  const prose = size === 'sm'
    ? 'prose prose-sm max-w-none prose-p:my-1 prose-li:my-0'
    : 'prose prose-base max-w-none prose-p:my-1.5 prose-li:my-0.5'

  return (
    <div className={`${prose} prose-headings:text-ink prose-p:text-ink prose-li:text-ink prose-strong:text-ink ${className}`}>
      <ReactMarkdown>{text}</ReactMarkdown>
    </div>
  )
}
