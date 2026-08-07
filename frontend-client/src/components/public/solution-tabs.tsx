'use client'

import { useState } from 'react'
import { Check } from 'lucide-react'

type SolutionTab = {
  id: string
  label: string
  title: string
  description: string
  features: readonly string[]
  focus: string
}

type SolutionTabsProps = {
  items: readonly SolutionTab[]
}

export function SolutionTabs({ items }: SolutionTabsProps) {
  const [activeId, setActiveId] = useState(items[0]?.id ?? '')
  const active = items.find((tab) => tab.id === activeId) ?? items[0]

  if (!active) return null

  return (
    <div className="solution-tabs">
      <div
        className="solution-tabs__list"
        role="tablist"
        aria-label="Nhóm giải pháp"
      >
        {items.map((tab) => (
          <button
            type="button"
            role="tab"
            id={`solution-tab-${tab.id}`}
            aria-controls={`solution-panel-${tab.id}`}
            aria-selected={active.id === tab.id}
            tabIndex={active.id === tab.id ? 0 : -1}
            onClick={() => setActiveId(tab.id)}
            onKeyDown={(event) => {
              const index = items.findIndex((item) => item.id === active.id)
              const direction =
                event.key === 'ArrowRight'
                  ? 1
                  : event.key === 'ArrowLeft'
                    ? -1
                    : 0
              const nextIndex =
                event.key === 'Home'
                  ? 0
                  : event.key === 'End'
                    ? items.length - 1
                    : direction
                      ? (index + direction + items.length) % items.length
                      : null
              if (nextIndex === null) return
              event.preventDefault()
              const next = items[nextIndex]
              setActiveId(next.id)
              document.getElementById(`solution-tab-${next.id}`)?.focus()
            }}
            key={tab.id}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div
        key={active.id}
        id={`solution-panel-${active.id}`}
        role="tabpanel"
        aria-labelledby={`solution-tab-${active.id}`}
        className="solution-tabs__panel"
      >
        <div className="solution-tabs__copy">
          <span className="solution-tabs__category">{active.label}</span>
          <h3>{active.title}</h3>
          <p>{active.description}</p>
          <ul>
            {active.features.map((feature) => (
              <li key={feature}>
                <Check size={16} aria-hidden="true" /> {feature}
              </li>
            ))}
          </ul>
        </div>
        <div className="solution-tabs__visual" aria-hidden="true">
          <header>
            <span>QTS / {active.label}</span>
            <small>Mô hình tiếp cận</small>
          </header>
          <div className="solution-tabs__focus">
            <span>Trọng tâm thiết kế</span>
            <strong>{active.focus}</strong>
            <small>Phạm vi được chốt sau khảo sát</small>
          </div>
          <div className="solution-tabs__rows">
            {active.features.map((feature) => (
              <div key={feature}>
                <span className="solution-tabs__row-icon">
                  <Check size={15} aria-hidden="true" />
                </span>
                <strong>{feature}</strong>
                <small>Điểm cần xác nhận</small>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
