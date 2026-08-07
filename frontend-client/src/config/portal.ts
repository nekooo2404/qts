import {
  Bell,
  BriefcaseBusiness,
  ClipboardList,
  FileCheck2,
  FileText,
  Gauge,
  LifeBuoy,
  Megaphone,
  ReceiptText,
  Settings,
  UserRound,
} from 'lucide-react'

export const portalNavigation = [
  {
    label: 'Tổng quan',
    href: '/portal/dashboard',
    icon: Gauge,
    roles: ['ADMIN', 'STAFF', 'CUSTOMER'],
  },
  {
    label: 'Dự án',
    href: '/portal/projects',
    icon: BriefcaseBusiness,
    roles: ['ADMIN', 'STAFF', 'CUSTOMER'],
  },
  {
    label: 'Công việc',
    href: '/portal/tasks',
    icon: ClipboardList,
    roles: ['ADMIN', 'STAFF', 'CUSTOMER'],
  },
  {
    label: 'Ticket hỗ trợ',
    href: '/portal/tickets',
    icon: LifeBuoy,
    roles: ['ADMIN', 'STAFF', 'CUSTOMER'],
  },
  {
    label: 'Tài liệu',
    href: '/portal/documents',
    icon: FileText,
    roles: ['ADMIN', 'STAFF', 'CUSTOMER'],
  },
  {
    label: 'Hợp đồng',
    href: '/portal/contracts',
    icon: FileCheck2,
    roles: ['ADMIN', 'STAFF', 'CUSTOMER'],
  },
  {
    label: 'Hóa đơn',
    href: '/portal/invoices',
    icon: ReceiptText,
    roles: ['ADMIN', 'STAFF', 'CUSTOMER'],
  },
  {
    label: 'Thông báo',
    href: '/portal/notifications',
    icon: Bell,
    roles: ['ADMIN', 'STAFF', 'CUSTOMER'],
  },
  {
    label: 'Bảng tin',
    href: '/portal/announcements',
    icon: Megaphone,
    roles: ['ADMIN', 'STAFF', 'CUSTOMER'],
  },
] as const

export const accountNavigation = [
  {
    label: 'Hồ sơ',
    href: '/portal/profile',
    icon: UserRound,
    roles: ['ADMIN', 'STAFF', 'CUSTOMER'],
  },
  {
    label: 'Cài đặt',
    href: '/portal/settings',
    icon: Settings,
    roles: ['ADMIN', 'STAFF', 'CUSTOMER'],
  },
] as const

export const statusLabels: Record<string, string> = {
  PLANNING: 'Lập kế hoạch',
  ACTIVE: 'Đang thực hiện',
  ON_HOLD: 'Tạm dừng',
  COMPLETED: 'Hoàn thành',
  CANCELLED: 'Đã hủy',
  UPCOMING: 'Sắp tới',
  TODO: 'Cần làm',
  IN_PROGRESS: 'Đang xử lý',
  REVIEW: 'Đang duyệt',
  BLOCKED: 'Đang vướng',
  DONE: 'Hoàn tất',
  NEW: 'Mới',
  ACKNOWLEDGED: 'Đã tiếp nhận',
  WAITING_CUSTOMER: 'Chờ khách hàng',
  RESOLVED: 'Đã giải quyết',
  CLOSED: 'Đã đóng',
  DRAFT: 'Bản nháp',
  PUBLISHED: 'Đã xuất bản',
  ARCHIVED: 'Lưu trữ',
  SENT: 'Đã phát hành',
  OVERDUE: 'Quá hạn',
  PAID: 'Đã thanh toán',
  EXPIRED: 'Hết hiệu lực',
  TERMINATED: 'Đã chấm dứt',
}

export const priorityLabels: Record<string, string> = {
  LOW: 'Thấp',
  MEDIUM: 'Trung bình',
  HIGH: 'Cao',
  URGENT: 'Khẩn cấp',
}

export const roleLabels: Record<string, string> = {
  ADMIN: 'Quản trị viên',
  STAFF: 'Nhân sự QTS',
  CUSTOMER: 'Khách hàng',
}
