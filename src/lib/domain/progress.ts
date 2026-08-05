export type ProgressTask = {
  status: string
  progress: number
}

function clampProgress(value: number) {
  if (!Number.isFinite(value)) {
    return 0
  }

  return Math.min(100, Math.max(0, value))
}

export function calculateProjectProgress(tasks: ProgressTask[]) {
  if (tasks.length === 0) {
    return 0
  }

  const total = tasks.reduce(
    (sum, task) => sum + clampProgress(task.progress),
    0,
  )

  return Math.round(total / tasks.length)
}
