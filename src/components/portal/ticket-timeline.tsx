import { Clock3, LockKeyhole } from 'lucide-react'

import { roleLabels } from '@/config/portal'
import { formatDateTime } from '@/lib/utils'

type TimelineMessage = {
  id: string
  content: string
  internal: boolean
  createdAt: Date | string
  author: { id: string; name: string; role: string }
}

export function TicketTimeline({
  messages,
  currentUserId,
}: {
  messages: TimelineMessage[]
  currentUserId: string
}) {
  return (
    <ol className="ticket-timeline">
      {messages.map((message) => (
        <li
          className={message.author.id === currentUserId ? 'is-own' : undefined}
          key={message.id}
        >
          <div className="ticket-timeline__avatar" aria-hidden>
            {message.author.name.slice(0, 1).toUpperCase()}
          </div>
          <article>
            <header>
              <div>
                <strong>{message.author.name}</strong>
                <span>
                  {roleLabels[message.author.role] ?? message.author.role}
                </span>
              </div>
              <time dateTime={new Date(message.createdAt).toISOString()}>
                <Clock3 size={13} aria-hidden />{' '}
                {formatDateTime(message.createdAt)}
              </time>
            </header>
            {message.internal && (
              <span className="ticket-timeline__internal">
                <LockKeyhole size={13} aria-hidden /> Ghi chú nội bộ
              </span>
            )}
            <p>{message.content}</p>
          </article>
        </li>
      ))}
    </ol>
  )
}
