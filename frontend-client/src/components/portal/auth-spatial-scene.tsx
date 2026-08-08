import { Activity, Boxes, LockKeyhole, ShieldCheck } from 'lucide-react'

import { PortalPreview } from '@client/components/public/portal-preview'

export function AuthSpatialScene() {
  return (
    <aside
      className="portal-auth-layout__visual"
      aria-labelledby="auth-spatial-title"
    >
      <div className="auth-space__grid" aria-hidden="true" />
      <div className="auth-space__plane" aria-hidden="true" />
      <div
        className="auth-space__beam auth-space__beam--one"
        aria-hidden="true"
      />
      <div
        className="auth-space__beam auth-space__beam--two"
        aria-hidden="true"
      />

      <div className="auth-space__content">
        <p className="auth-space__eyebrow">
          <span className="auth-space__signal" aria-hidden="true" />
          QTS Portal <span aria-hidden="true">·</span> không gian vận hành
        </p>
        <h2 id="auth-spatial-title">
          Mọi hoạt động dự án trong một không gian có phân quyền
        </h2>
        <p className="auth-space__description">
          Dự án, ticket, tài liệu, hợp đồng và thông báo được kết nối theo đúng
          vai trò.
        </p>
        <ul className="auth-space__signals" aria-label="Các khả năng chính">
          <li>
            <ShieldCheck size={16} aria-hidden="true" />
            <span>Phân quyền theo vai trò</span>
          </li>
          <li>
            <Activity size={16} aria-hidden="true" />
            <span>Theo dõi theo từng mốc</span>
          </li>
        </ul>
      </div>

      <div className="auth-space__stage">
        <span className="auth-space__stage-label" aria-hidden="true">
          WORKSPACE / 01
        </span>
        <div className="auth-space__preview-shell">
          <PortalPreview compact />
        </div>
        <div
          className="auth-space__annotation auth-space__annotation--access"
          aria-hidden="true"
        >
          <LockKeyhole size={15} />
          <span>LỚP TRUY CẬP</span>
          <strong>THEO VAI TRÒ</strong>
        </div>
        <div
          className="auth-space__annotation auth-space__annotation--flow"
          aria-hidden="true"
        >
          <Boxes size={15} />
          <span>LUỒNG DỰ ÁN</span>
        </div>
      </div>

      <div className="auth-space__footer" aria-hidden="true">
        <span>QTS TECHNOLOGY</span>
        <span>KẾT NỐI NỘI BỘ</span>
      </div>
    </aside>
  )
}
