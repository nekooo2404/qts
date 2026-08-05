import type { Metadata } from 'next'
import { Check, Minus, ShieldCheck } from 'lucide-react'

import { PortalPageHeader } from '@/components/portal/portal-page-header'

export const metadata: Metadata = { title: 'Vai trò và quyền' }
const permissions = [
  ['Xem mọi dự án', true, false, false],
  ['Xem dự án được phân công', true, true, false],
  ['Xem dữ liệu theo tổ chức', true, true, true],
  ['Quản lý người dùng và vai trò', true, false, false],
  ['Quản lý CMS và audit log', true, false, false],
  ['Cập nhật công việc', true, true, false],
  ['Xử lý và gán ticket', true, true, false],
  ['Tạo và phản hồi ticket', true, true, true],
  ['Upload tài liệu', true, true, false],
  ['Xem hợp đồng và hóa đơn', true, true, true],
] as const

export default function AdminRolesPage() {
  return (
    <div className="portal-page">
      <PortalPageHeader
        eyebrow="RBAC policy"
        title="Vai trò và quyền"
        description="Ba vai trò được cố định bằng enum để chính sách truy cập nhất quán giữa UI, route và database."
      />
      <section className="portal-panel role-policy-note">
        <ShieldCheck size={20} />
        <div>
          <h2>Quyền được quản lý qua tài khoản</h2>
          <p>
            Đổi role của người dùng tại trang Người dùng. Không tạo role tùy ý
            trong bản demo để tránh cấu hình quyền không đồng bộ với server
            policy.
          </p>
        </div>
      </section>
      <div className="data-table-shell role-matrix">
        <div className="data-table-scroll">
          <table>
            <thead>
              <tr>
                <th>Khả năng</th>
                <th>ADMIN</th>
                <th>STAFF</th>
                <th>CUSTOMER</th>
              </tr>
            </thead>
            <tbody>
              {permissions.map(([label, admin, staff, customer]) => (
                <tr key={label}>
                  <td>{label}</td>
                  {[admin, staff, customer].map((allowed, index) => (
                    <td
                      key={index}
                      aria-label={allowed ? 'Được phép' : 'Không được phép'}
                    >
                      {allowed ? (
                        <Check className="permission-yes" size={17} />
                      ) : (
                        <Minus className="permission-no" size={17} />
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
