import { homeFaqs } from '@/config/marketing'

export function HomeFaq() {
  return (
    <div className="home-faq">
      {homeFaqs.map((item, index) => (
        <details key={item.question} open={index === 0}>
          <summary>
            <span aria-hidden="true">{String(index + 1).padStart(2, '0')}</span>
            <strong>{item.question}</strong>
          </summary>
          <p>{item.answer}</p>
        </details>
      ))}
    </div>
  )
}
