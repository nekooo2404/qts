'use client'

import { useEffect, useState } from 'react'
import { Bell, Check, MonitorCog } from 'lucide-react'

import { Button } from '@/components/ui/button'

type Preferences = {
  inApp: boolean
  email: boolean
  weeklyDigest: boolean
  compactTables: boolean
}
const defaults: Preferences = {
  inApp: true,
  email: true,
  weeklyDigest: false,
  compactTables: false,
}

export function SettingsPanel({ canUpdate = true }: { canUpdate?: boolean }) {
  const [preferences, setPreferences] = useState(defaults)
  const [saved, setSaved] = useState(false)
  useEffect(() => {
    const timeout = window.setTimeout(() => {
      try {
        const stored = window.localStorage.getItem('qts_portal_preferences')
        if (stored)
          setPreferences({
            ...defaults,
            ...(JSON.parse(stored) as Partial<Preferences>),
          })
      } catch {
        /* Local preferences can fall back to defaults. */
      }
    }, 0)
    return () => window.clearTimeout(timeout)
  }, [])
  function toggle(key: keyof Preferences) {
    if (!canUpdate) return
    setSaved(false)
    setPreferences((current) => ({ ...current, [key]: !current[key] }))
  }
  function save() {
    if (!canUpdate) return
    window.localStorage.setItem(
      'qts_portal_preferences',
      JSON.stringify(preferences),
    )
    setSaved(true)
  }
  return (
    <div className="settings-sections">
      <section className="portal-panel">
        <header className="portal-panel__header">
          <div>
            <h2>Thông báo</h2>
            <p>Tùy chọn này được lưu cục bộ cho bản demo.</p>
          </div>
          <Bell size={18} />
        </header>
        <div className="settings-list">
          <label className="checkbox-field checkbox-field--custom settings-toggle">
            <input
              type="checkbox"
              checked={preferences.inApp}
              onChange={() => toggle('inApp')}
              disabled={!canUpdate}
            />
            <span className="checkbox-field__box" aria-hidden="true">
              <Check size={14} strokeWidth={3} />
            </span>
            <span className="checkbox-field__copy">
              <strong>Thông báo trong portal</strong>
              <small>Hiển thị cập nhật trong notification center.</small>
            </span>
          </label>
          <label className="checkbox-field checkbox-field--custom settings-toggle">
            <input
              type="checkbox"
              checked={preferences.email}
              onChange={() => toggle('email')}
              disabled={!canUpdate}
            />
            <span className="checkbox-field__box" aria-hidden="true">
              <Check size={14} strokeWidth={3} />
            </span>
            <span className="checkbox-field__copy">
              <strong>Email thông báo</strong>
              <small>
                Mô phỏng lựa chọn nhận email, chưa kết nối mail provider.
              </small>
            </span>
          </label>
          <label className="checkbox-field checkbox-field--custom settings-toggle">
            <input
              type="checkbox"
              checked={preferences.weeklyDigest}
              onChange={() => toggle('weeklyDigest')}
              disabled={!canUpdate}
            />
            <span className="checkbox-field__box" aria-hidden="true">
              <Check size={14} strokeWidth={3} />
            </span>
            <span className="checkbox-field__copy">
              <strong>Tổng hợp hàng tuần</strong>
              <small>
                Nhận bản tổng hợp hoạt động định kỳ khi tích hợp email
                production.
              </small>
            </span>
          </label>
        </div>
      </section>
      <section className="portal-panel">
        <header className="portal-panel__header">
          <div>
            <h2>Giao diện</h2>
            <p>Dark mode có thể bật ngay trên header portal.</p>
          </div>
          <MonitorCog size={18} />
        </header>
        <div className="settings-list">
          <label className="checkbox-field checkbox-field--custom settings-toggle">
            <input
              type="checkbox"
              checked={preferences.compactTables}
              onChange={() => toggle('compactTables')}
              disabled={!canUpdate}
            />
            <span className="checkbox-field__box" aria-hidden="true">
              <Check size={14} strokeWidth={3} />
            </span>
            <span className="checkbox-field__copy">
              <strong>Bảng dữ liệu thu gọn</strong>
              <small>Lưu sở thích mật độ hiển thị trên thiết bị này.</small>
            </span>
          </label>
        </div>
      </section>
      <div className="settings-actions">
        <Button onClick={save} disabled={!canUpdate}>
          <Check size={17} /> Lưu cài đặt
        </Button>
        {saved && <span role="status">Đã lưu trên thiết bị này.</span>}
        {!canUpdate && <span role="status">Bạn chỉ có quyền xem cài đặt.</span>}
      </div>
    </div>
  )
}
