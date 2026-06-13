import type { Message } from '../types/messages'

interface MessageBubbleProps {
  message: Message
}

function formatTimestamp(date: Date): string {
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

export default function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.role === 'user'

  return (
    <div className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}>
      <div
        className={`max-w-[85%] animate-fadeInUp px-4 py-3 ${
          isUser
            ? 'self-end rounded-2xl rounded-tr-sm bg-primary-500 text-white'
            : 'self-start rounded-2xl rounded-tl-sm bg-primary-50 text-neutral-800'
        }`}
      >
        <p className="whitespace-pre-wrap text-base leading-relaxed">{message.content}</p>
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
