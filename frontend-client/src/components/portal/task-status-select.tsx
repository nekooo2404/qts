'use client'

import { useEffect, useId, useRef, useState, type KeyboardEvent } from 'react'
import { Check, ChevronDown } from 'lucide-react'

import { statusLabels } from '@client/config/portal'

const taskStatusOptions = [
  'TODO',
  'IN_PROGRESS',
  'REVIEW',
  'BLOCKED',
  'DONE',
] as const

type TaskStatus = (typeof taskStatusOptions)[number]

export function TaskStatusSelect({
  value,
  onChange,
  disabled = false,
}: {
  value: string
  onChange: (value: TaskStatus) => void
  disabled?: boolean
}) {
  const rootRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const listboxId = `task-status-listbox-${useId().replaceAll(':', '')}`
  const selectedIndex = Math.max(
    0,
    taskStatusOptions.indexOf(value as TaskStatus),
  )
  const [open, setOpen] = useState(false)
  const [highlightedIndex, setHighlightedIndex] = useState(selectedIndex)

  useEffect(() => {
    if (!open) return
    function handlePointerDown(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false)
    }
    document.addEventListener('pointerdown', handlePointerDown)
    return () => document.removeEventListener('pointerdown', handlePointerDown)
  }, [open])

  function choose(option: TaskStatus) {
    onChange(option)
    setOpen(false)
    triggerRef.current?.focus()
  }

  function toggleOpen() {
    setHighlightedIndex(selectedIndex)
    setOpen((current) => !current)
  }

  function handleKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
    if (disabled) return
    if (event.key === 'Escape' && open) {
      event.preventDefault()
      setOpen(false)
      return
    }
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      if (open) {
        choose(taskStatusOptions[highlightedIndex])
      } else {
        toggleOpen()
      }
      return
    }
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault()
      setOpen(true)
      setHighlightedIndex((current) => {
        const delta = event.key === 'ArrowDown' ? 1 : -1
        const base = open ? current : selectedIndex
        return (
          (base + delta + taskStatusOptions.length) % taskStatusOptions.length
        )
      })
      return
    }
    if (event.key === 'Home' || event.key === 'End') {
      event.preventDefault()
      setOpen(true)
      setHighlightedIndex(
        event.key === 'Home' ? 0 : taskStatusOptions.length - 1,
      )
    }
  }

  const selected = taskStatusOptions[selectedIndex]

  return (
    <div className="task-status-select" ref={rootRef}>
      <button
        ref={triggerRef}
        className="task-status-select__trigger"
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listboxId}
        aria-label="Trạng thái công việc"
        disabled={disabled}
        data-state={open ? 'open' : 'closed'}
        onClick={toggleOpen}
        onKeyDown={handleKeyDown}
      >
        <span>{statusLabels[selected] ?? selected}</span>
        <ChevronDown size={15} aria-hidden />
      </button>
      {open && (
        <div
          id={listboxId}
          className="task-status-select__menu"
          role="listbox"
          aria-label="Trạng thái công việc"
        >
          {taskStatusOptions.map((option, index) => {
            const isSelected = option === selected
            const isHighlighted = index === highlightedIndex
            return (
              <div
                className={`task-status-select__option${
                  isHighlighted ? ' is-highlighted' : ''
                }${isSelected ? ' is-selected' : ''}`}
                key={option}
                id={`${listboxId}-${option.toLowerCase()}`}
                role="option"
                aria-selected={isSelected}
                tabIndex={-1}
                onMouseEnter={() => setHighlightedIndex(index)}
                onPointerDown={(event) => {
                  event.preventDefault()
                  choose(option)
                }}
              >
                <span>{statusLabels[option] ?? option}</span>
                {isSelected && <Check size={15} aria-hidden />}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
