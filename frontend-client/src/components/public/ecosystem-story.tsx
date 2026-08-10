'use client'

import Image from 'next/image'
import Link from 'next/link'
import {
  ArrowRight,
  Check,
  ChevronDown,
  Database,
  GitBranch,
  ShieldCheck,
} from 'lucide-react'
import { useId, useState } from 'react'

import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'

const tabs = [
  {
    id: 'flow',
    eyebrow: 'Một luồng làm việc',
    title: 'Kết nối chặt chẽ các nghiệp vụ trong doanh nghiệp',
    description:
      'Giảm nhập liệu thủ công bằng cách đưa quy trình, vai trò và dữ liệu về cùng một bản đồ vận hành.',
    features: [
      'Giảm các bước giao tiếp chồng chéo',
      'Theo dõi điểm bàn giao theo từng vai trò',
    ],
    icon: GitBranch,
    sceneTitle: 'Luồng vận hành',
    sceneNote: 'Các mốc được nối theo đúng vai trò',
  },
  {
    id: 'data',
    eyebrow: 'Một nguồn dữ liệu',
    title: 'Liên thông dữ liệu giữa các chi nhánh và hệ thống',
    description:
      'Chuẩn hóa hợp đồng dữ liệu, đồng bộ có kiểm soát và giữ lại lịch sử để đội ngũ luôn nhìn cùng một trạng thái.',
    features: [
      'Nguồn dữ liệu có thể truy vết',
      'Dashboard theo ngữ cảnh sử dụng',
    ],
    icon: Database,
    sceneTitle: 'Dữ liệu liên thông',
    sceneNote: 'Nguồn vào được kiểm tra trước khi đồng bộ',
  },
  {
    id: 'access',
    eyebrow: 'Một lớp truy cập',
    title: 'Phân quyền rõ ràng cho từng người và từng ứng dụng',
    description:
      'QTS kết hợp vai trò, chính sách và lịch sử truy cập để mỗi thành viên chỉ thấy đúng phần việc của mình.',
    features: [
      'RBAC và chính sách theo ngữ cảnh',
      'Mọi thay đổi có audit trail',
    ],
    icon: ShieldCheck,
    sceneTitle: 'Không gian có phân quyền',
    sceneNote: 'Quyền truy cập được kiểm tra ở mỗi điểm chạm',
  },
] as const

const sceneLabels = [
  ['Website', 'Nội dung'],
  ['QTS Work', 'Công việc'],
  ['QTS CRM', 'Khách hàng'],
  ['Dữ liệu', 'Dashboard'],
  ['Tích hợp', 'API'],
  ['Portal', 'Dự án'],
  ['Nhân sự', 'Vai trò'],
  ['Hỗ trợ', 'Ticket'],
] as const

const sceneLabelSegments = [0, 1, 2, 3, 1, 0, 2, 3] as const

type EcosystemStoryProps = {
  showScene?: boolean
}

export function EcosystemStory({ showScene = true }: EcosystemStoryProps) {
  const [activeIndex, setActiveIndex] = useState(0)
  const idPrefix = useId().replace(/:/g, '')
  const active = tabs[activeIndex]

  function selectTab(index: number) {
    setActiveIndex(Math.max(0, Math.min(index, tabs.length - 1)))
  }

  function handleTabKeyDown(event: React.KeyboardEvent<HTMLButtonElement>) {
    const focusedIndex = Number(event.currentTarget.dataset.index)
    const currentIndex = Number.isInteger(focusedIndex)
      ? focusedIndex
      : activeIndex
    const direction =
      event.key === 'ArrowDown' || event.key === 'ArrowRight'
        ? 1
        : event.key === 'ArrowUp' || event.key === 'ArrowLeft'
          ? -1
          : 0
    const nextIndex =
      event.key === 'Home'
        ? 0
        : event.key === 'End'
          ? tabs.length - 1
          : direction
            ? (currentIndex + direction + tabs.length) % tabs.length
            : null

    if (nextIndex === null) return
    event.preventDefault()
    selectTab(nextIndex)
    document.getElementById(`${idPrefix}-tab-${tabs[nextIndex].id}`)?.focus()
  }

  return (
    <section
      className={cn(
        'section ecosystem-story',
        !showScene && 'ecosystem-story--without-scene',
      )}
      id="he-sinh-thai-tuong-tac"
      aria-labelledby="ecosystem-story-title"
    >
      <div className="container ecosystem-story__inner">
        {showScene ? (
          <div className="ecosystem-story__scene-wrap">
            <SpatialScene active={active} activeIndex={activeIndex} />
          </div>
        ) : null}

        <div className="ecosystem-story__copy">
          <p className="eyebrow">Một nguồn dữ liệu hợp nhất</p>
          <h2 id="ecosystem-story-title">
            Một góc nhìn toàn cảnh cho doanh nghiệp.
          </h2>
          <p className="ecosystem-story__intro">
            Chọn một lớp vận hành để xem QTS kết nối con người, quy trình và hệ
            thống thành một luồng dễ theo dõi.
          </p>

          <div
            className="ecosystem-story__tabs"
            aria-label="Các lớp vận hành QTS"
          >
            <div className="ecosystem-story__tablist">
              {tabs.map((tab, index) => {
                const Icon = tab.icon
                const isActive = index === activeIndex
                const tabId = `${idPrefix}-tab-${tab.id}`
                const panelId = `${idPrefix}-panel-${tab.id}`

                return (
                  <div
                    className={cn(
                      'ecosystem-story__item',
                      isActive && 'is-active',
                    )}
                    key={tab.id}
                  >
                    <button
                      type="button"
                      className={cn(
                        'ecosystem-story__tab',
                        isActive && 'is-active',
                      )}
                      id={tabId}
                      data-index={index}
                      aria-controls={panelId}
                      aria-expanded={isActive}
                      tabIndex={0}
                      onClick={() => selectTab(index)}
                      onKeyDown={handleTabKeyDown}
                    >
                      <span
                        className="ecosystem-story__tab-icon"
                        aria-hidden="true"
                      >
                        <Icon size={19} strokeWidth={1.8} />
                      </span>
                      <span className="ecosystem-story__tab-copy">
                        <span className="ecosystem-story__tab-eyebrow">
                          {tab.eyebrow}
                        </span>
                        <strong>{tab.title}</strong>
                      </span>
                      <ChevronDown
                        className="ecosystem-story__tab-arrow"
                        size={18}
                        aria-hidden="true"
                      />
                    </button>
                    <div
                      id={panelId}
                      role="region"
                      aria-labelledby={tabId}
                      aria-hidden={!isActive}
                      className={cn(
                        'ecosystem-story__panel',
                        isActive && 'is-open',
                      )}
                    >
                      <div className="ecosystem-story__panel-inner">
                        <p>{tab.description}</p>
                        <ul>
                          {tab.features.map((feature) => (
                            <li key={feature}>
                              <Check size={15} aria-hidden="true" />
                              <span>{feature}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          <div className="ecosystem-story__actions">
            <Link
              className={cn(
                buttonVariants({ variant: 'primary' }),
                'ecosystem-story__cta',
              )}
              href="/lien-he"
            >
              Dùng thử miễn phí <ArrowRight size={17} aria-hidden="true" />
            </Link>
            <Link className="inline-link" href="/san-pham">
              Xem hệ sinh thái <ArrowRight size={16} aria-hidden="true" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}

type SpatialSceneProps = {
  active: (typeof tabs)[number]
  activeIndex: number
}

function SpatialScene({ active, activeIndex }: SpatialSceneProps) {
  const [hoveredLabelIndex, setHoveredLabelIndex] = useState<number | null>(
    null,
  )
  const [focusedLabelIndex, setFocusedLabelIndex] = useState<number | null>(
    null,
  )
  const [selectedLabelIndex, setSelectedLabelIndex] = useState<number | null>(
    null,
  )
  const engagedLabelIndex =
    hoveredLabelIndex ?? focusedLabelIndex ?? selectedLabelIndex
  const engagedSegment =
    engagedLabelIndex === null
      ? undefined
      : sceneLabelSegments[engagedLabelIndex]
  const interactionLocksOrbit =
    hoveredLabelIndex !== null || focusedLabelIndex !== null

  return (
    <figure
      className={cn(
        'ecosystem-story__scene',
        interactionLocksOrbit && 'has-locked-orbit',
      )}
      data-scene-state={active.id}
      data-engaged-segment={engagedSegment}
      aria-labelledby="ecosystem-story-scene-caption"
    >
      <figcaption id="ecosystem-story-scene-caption" className="sr-only">
        Bản đồ spatial QTS đang hiển thị trạng thái {active.sceneTitle}.
      </figcaption>
      <div className="ecosystem-story__scene-grid" aria-hidden="true" />
      <svg
        className="ecosystem-story__scene-routes"
        viewBox="0 0 640 520"
        aria-hidden="true"
      >
        <path d="M20 112C156 36 210 112 312 170s172 14 304-70" />
        <path d="M0 390C100 324 170 360 250 410s190 60 370-80" />
        <path d="M124 510C144 400 216 352 316 352c112 0 152 56 284 148" />
        <path d="M312 0c-4 102 44 164 144 196 72 23 120 11 172-40" />
        <circle cx="313" cy="246" r="142" />
      </svg>

      <div
        className="ecosystem-story__scene-orbit ecosystem-story__scene-orbit--outer"
        aria-hidden="true"
      />
      <div
        className="ecosystem-story__scene-orbit ecosystem-story__scene-orbit--inner"
        aria-hidden="true"
      />

      <div className="ecosystem-story__scene-core">
        <div className="ecosystem-story__scene-core-halo" />
        <div className="ecosystem-story__scene-core-tile">
          <div className="ecosystem-story__scene-ring">
            <span />
          </div>
          <span className="ecosystem-story__scene-mark">
            <Image src="/brand/qts-shield.png" alt="" width={46} height={56} />
          </span>
        </div>
        <div className="ecosystem-story__scene-core-caption">
          <span>QTS / 0{activeIndex + 1}</span>
          <strong>{active.sceneTitle}</strong>
          <small>{active.sceneNote}</small>
        </div>
      </div>

      <div className="ecosystem-story__scene-labels">
        {sceneLabels.map(([label, detail], index) => (
          <button
            type="button"
            className={cn(
              'ecosystem-story__scene-label',
              `ecosystem-story__scene-label--${index + 1}`,
              index % 3 === activeIndex && 'is-highlighted',
              index === hoveredLabelIndex && 'is-hovered',
              index === focusedLabelIndex && 'is-focused',
              index === selectedLabelIndex && 'is-selected',
              engagedLabelIndex !== null &&
                index !== engagedLabelIndex &&
                'is-dimmed',
            )}
            aria-label={`${label}, ${detail}`}
            aria-pressed={selectedLabelIndex === index}
            data-segment={sceneLabelSegments[index]}
            key={label}
            onClick={() => setSelectedLabelIndex(index)}
            onMouseEnter={() => setHoveredLabelIndex(index)}
            onMouseLeave={() => setHoveredLabelIndex(null)}
            onFocus={() => setFocusedLabelIndex(index)}
            onBlur={() => setFocusedLabelIndex(null)}
          >
            <i />
            <b>{label}</b>
            <small>{detail}</small>
          </button>
        ))}
      </div>

      <span className="ecosystem-story__scene-stamp">
        QTS TECHNOLOGY · CONNECTED
      </span>
    </figure>
  )
}
