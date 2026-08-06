import { Quote } from 'lucide-react'

type TestimonialCardProps = {
  organization: string
  role: string
  quote: string
}

export function TestimonialCard({
  organization,
  role,
  quote,
}: TestimonialCardProps) {
  return (
    <figure className="testimonial-card">
      <Quote size={22} aria-hidden="true" />
      <blockquote>{quote}</blockquote>
      <figcaption>
        <strong>{organization}</strong>
        <span>{role}</span>
      </figcaption>
      <small>
        Tình huống minh họa; chưa phải lời chứng thực của khách hàng.
      </small>
    </figure>
  )
}
