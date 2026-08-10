'use client'

import { useEffect, useState } from 'react'
import { ArrowLeft, ArrowRight, Pause, Play } from 'lucide-react'

import { CaseStudyCard } from '@client/components/public/case-study-card'

type CaseStudy = Parameters<typeof CaseStudyCard>[0]['caseStudy']

export function CaseStudyRotator({
  caseStudies,
}: {
  caseStudies: CaseStudy[]
}) {
  const [activeIndex, setActiveIndex] = useState(0)
  const [autoPlay, setAutoPlay] = useState(true)
  const [hovered, setHovered] = useState(false)
  const [focused, setFocused] = useState(false)
  const [reducedMotion, setReducedMotion] = useState(false)

  const paused = !autoPlay || hovered || focused || reducedMotion

  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)')
    const syncPreference = () => setReducedMotion(media.matches)

    syncPreference()
    media.addEventListener('change', syncPreference)
    return () => media.removeEventListener('change', syncPreference)
  }, [])

  useEffect(() => {
    if (caseStudies.length < 2 || paused) return

    const timer = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % caseStudies.length)
    }, 5600)

    return () => window.clearInterval(timer)
  }, [caseStudies.length, paused, reducedMotion])

  if (!caseStudies.length) return null

  const active = caseStudies[activeIndex] ?? caseStudies[0]

  return (
    <div
      className="case-study-rotator"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onFocus={() => setFocused(true)}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
          setFocused(false)
        }
      }}
    >
      <div className="case-study-rotator__viewport">
        <div className="case-study-rotator__slide" key={active.slug}>
          <CaseStudyCard caseStudy={active} />
        </div>
      </div>
      {caseStudies.length > 1 && (
        <div
          className="case-study-rotator__controls"
          aria-label="Điều hướng tình huống minh họa"
        >
          <span className="case-study-rotator__status" aria-live="polite">
            {String(activeIndex + 1).padStart(2, '0')} /{' '}
            {String(caseStudies.length).padStart(2, '0')}
          </span>
          <div className="case-study-rotator__dots">
            {caseStudies.map((caseStudy, index) => (
              <button
                type="button"
                className={index === activeIndex ? 'is-active' : undefined}
                aria-label={`Xem tình huống ${index + 1}: ${caseStudy.title}`}
                aria-current={index === activeIndex ? 'true' : undefined}
                onClick={() => setActiveIndex(index)}
                key={caseStudy.slug}
              />
            ))}
          </div>
          <div className="case-study-rotator__arrows">
            <button
              type="button"
              className="case-study-rotator__pause"
              aria-label={
                autoPlay
                  ? 'Tạm dừng tự động chuyển tình huống'
                  : 'Tiếp tục tự động chuyển tình huống'
              }
              aria-pressed={!autoPlay}
              onClick={() => {
                setAutoPlay((current) => !current)
                setFocused(false)
              }}
            >
              {autoPlay ? (
                <Pause size={16} aria-hidden="true" />
              ) : (
                <Play size={16} aria-hidden="true" />
              )}
            </button>
            <button
              type="button"
              aria-label="Tình huống trước"
              onClick={() =>
                setActiveIndex(
                  (current) =>
                    (current - 1 + caseStudies.length) % caseStudies.length,
                )
              }
            >
              <ArrowLeft size={17} aria-hidden="true" />
            </button>
            <button
              type="button"
              aria-label="Tình huống tiếp theo"
              onClick={() =>
                setActiveIndex((current) => (current + 1) % caseStudies.length)
              }
            >
              <ArrowRight size={17} aria-hidden="true" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
