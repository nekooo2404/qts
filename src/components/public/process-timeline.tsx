import { implementationProcess } from '@/config/marketing'

export function ProcessTimeline() {
  return (
    <ol className="process-timeline">
      {implementationProcess.map(([number, title, description]) => (
        <li key={number}>
          <span>{number}</span>
          <div>
            <h3>{title}</h3>
            <p>{description}</p>
          </div>
        </li>
      ))}
    </ol>
  )
}
