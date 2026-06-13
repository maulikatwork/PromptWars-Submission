import type { Message } from '../types/messages'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

interface MessageBubbleProps {
  message: Message
}

function formatTimestamp(date: Date): string {
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

export default function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.role === 'user'
  const markdownTextColor = isUser ? 'text-white' : 'text-neutral-800'

  return (
    <div className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}>
      <div
        className={`max-w-[85%] animate-fadeInUp px-4 py-3 shadow-glass ${
          isUser
            ? 'self-end rounded-2xl rounded-tr-sm bg-gradient-to-br from-primary-500 to-primary-600 text-white'
            : 'self-start rounded-2xl rounded-tl-sm border border-white/50 bg-white/55 text-neutral-800 backdrop-blur-xl'
        }`}
      >
        <div className={`text-base leading-relaxed ${markdownTextColor}`}>
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          components={{
            p: ({ children }) => <p className="mb-3 last:mb-0">{children}</p>,
            ul: ({ children }) => <ul className="mb-3 list-disc pl-6 last:mb-0">{children}</ul>,
            ol: ({ children }) => <ol className="mb-3 list-decimal pl-6 last:mb-0">{children}</ol>,
            li: ({ children }) => <li className="mb-1">{children}</li>,
            h1: ({ children }) => (
              <h1 className="mb-3 text-xl font-semibold leading-tight last:mb-0">{children}</h1>
            ),
            h2: ({ children }) => (
              <h2 className="mb-3 text-lg font-semibold leading-tight last:mb-0">{children}</h2>
            ),
            h3: ({ children }) => (
              <h3 className="mb-2 text-base font-semibold leading-tight last:mb-0">{children}</h3>
            ),
            blockquote: ({ children }) => (
              <blockquote className="mb-3 border-l-2 border-current/30 pl-3 italic last:mb-0">
                {children}
              </blockquote>
            ),
            code: ({ inline, children }) =>
              inline ? (
                <code className="rounded bg-black/10 px-1 py-0.5 font-mono text-sm">{children}</code>
              ) : (
                <code className="block overflow-x-auto rounded-md bg-black/10 p-3 font-mono text-sm">
                  {children}
                </code>
              ),
            a: ({ href, children }) => (
              <a
                href={href}
                target="_blank"
                rel="noreferrer noopener"
                className="underline decoration-current underline-offset-2"
              >
                {children}
              </a>
            ),
          }}
        >
          {message.content}
        </ReactMarkdown>
        </div>
      </div>
      <time
        className="mt-1 text-xs text-neutral-400"
        dateTime={message.timestamp.toISOString()}
      >
        {formatTimestamp(message.timestamp)}
      </time>
    </div>
  )
}
