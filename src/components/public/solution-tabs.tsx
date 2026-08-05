'use client'

import { useState } from 'react'
import { Check } from 'lucide-react'

import { solutionTabs } from '@/config/marketing'

export function SolutionTabs() {
  const [activeId, setActiveId] = useState<(typeof solutionTabs)[number]['id']>(
    solutionTabs[0].id,
  )
  const active =
    solutionTabs.find((tab) => tab.id === activeId) ?? solutionTabs[0]

  return (
    <div className="solution-tabs">
      <div
        className="solution-tabs__list"
        role="tablist"
        aria-label="Nhóm giải pháp"
      >
        {solutionTabs.map((tab) => (
          <button
            type="button"
            role="tab"
            id={`solution-tab-${tab.id}`}
            aria-controls={`solution-panel-${tab.id}`}
            aria-selected={active.id === tab.id}
            tabIndex={active.id === tab.id ? 0 : -1}
            onClick={() => setActiveId(tab.id)}
            onKeyDown={(event) => {
              const index = solutionTabs.findIndex(
                (item) => item.id === active.id,
              )
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
                    ? solutionTabs.length - 1
                    : direction
                      ? (index + direction + solutionTabs.length) %
                        solutionTabs.length
                      : null
              if (nextIndex === null) return
              event.preventDefault()
              const next = solutionTabs[nextIndex]
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
            <small>Dữ liệu minh họa</small>
          </header>
          <div className="solution-tabs__score">
            <span>Mức hoàn thành quy trình mẫu</span>
            <strong>{active.accent}</strong>
            <i
              style={
                { '--progress-width': active.accent } as React.CSSProperties
              }
            />
          </div>
          <div className="solution-tabs__rows">
            {active.features.map((feature, index) => (
              <div key={feature}>
                <span>{String(index + 1).padStart(2, '0')}</span>
                <strong>{feature}</strong>
                <small>{index === 0 ? 'Đang theo dõi' : 'Đã cấu hình'}</small>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
