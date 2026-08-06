'use client'

import { useState } from 'react'
import { Minus, Plus } from 'lucide-react'

type FaqItem = {
  question: string
  answer: string
}

type HomeFaqProps = {
  items: readonly FaqItem[]
}

export function HomeFaq({ items }: HomeFaqProps) {
  const [openQuestion, setOpenQuestion] = useState<string | null>(
    items[0]?.question ?? null,
  )

  return (
    <div className="home-faq">
      {items.map((item, index) => {
        const isOpen = openQuestion === item.question
        const questionId = `home-faq-question-${index}`
        const answerId = `home-faq-answer-${index}`

        return (
          <article className="home-faq__item" key={item.question}>
            <div className="home-faq__question-row">
              <h3 id={questionId}>{item.question}</h3>
              <button
                type="button"
                aria-expanded={isOpen}
                aria-controls={answerId}
                aria-label={
                  isOpen
                    ? `Thu gọn câu trả lời: ${item.question}`
                    : `Mở câu trả lời: ${item.question}`
                }
                onClick={() => setOpenQuestion(isOpen ? null : item.question)}
              >
                {isOpen ? (
                  <Minus size={19} aria-hidden="true" />
                ) : (
                  <Plus size={19} aria-hidden="true" />
                )}
              </button>
            </div>
            <div
              id={answerId}
              role="region"
              aria-labelledby={questionId}
              hidden={!isOpen}
            >
              <p>{item.answer}</p>
            </div>
          </article>
        )
      })}
    </div>
  )
}
