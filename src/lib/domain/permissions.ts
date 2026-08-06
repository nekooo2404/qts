export type RoleName = 'ADMIN' | 'STAFF' | 'CUSTOMER'

/**
 * Permission keys are the stable contract shared by the server, navigation,
 * and the admin access editor. Keep them lowercase and namespaced by surface.
 */
export const PERMISSION_CATALOG = [
  {
    key: 'portal.dashboard.read',
    label: 'Xem tổng quan Portal',
    description: 'Mở trang tổng quan và các chỉ số vận hành trong Portal.',
    module: 'portal.dashboard',
    action: 'read',
  },
  {
    key: 'portal.projects.read',
    label: 'Xem dự án',
    description: 'Xem các dự án thuộc phạm vi truy cập của tài khoản.',
    module: 'portal.projects',
    action: 'read',
  },
  {
    key: 'portal.projects.read.all',
    label: 'Xem mọi dự án',
    description: 'Xem dự án trên mọi tổ chức, không giới hạn theo thành viên.',
    module: 'portal.projects',
    action: 'read.all',
  },
  {
    key: 'portal.projects.assign.all',
    label: 'Gán dự án cho mọi tổ chức',
    description: 'Tạo hoặc chuyển dự án giữa các tổ chức được quản lý.',
    module: 'portal.projects',
    action: 'assign.all',
  },
  {
    key: 'portal.projects.create',
    label: 'Tạo dự án',
    description: 'Tạo dự án mới cho một tổ chức được phép truy cập.',
    module: 'portal.projects',
    action: 'create',
  },
  {
    key: 'portal.projects.update',
    label: 'Cập nhật dự án',
    description: 'Chỉnh sửa thông tin, trạng thái và tiến độ dự án.',
    module: 'portal.projects',
    action: 'update',
  },
  {
    key: 'portal.projects.delete',
    label: 'Xóa dự án',
    description: 'Xóa vĩnh viễn dự án và dữ liệu phụ thuộc.',
    module: 'portal.projects',
    action: 'delete',
  },
  {
    key: 'portal.tasks.read',
    label: 'Xem công việc',
    description: 'Xem công việc thuộc phạm vi truy cập của tài khoản.',
    module: 'portal.tasks',
    action: 'read',
  },
  {
    key: 'portal.tasks.read.all',
    label: 'Xem mọi công việc',
    description: 'Xem công việc trên mọi dự án và tổ chức.',
    module: 'portal.tasks',
    action: 'read.all',
  },
  {
    key: 'portal.tasks.create',
    label: 'Tạo công việc',
    description: 'Tạo công việc trong một dự án được phép truy cập.',
    module: 'portal.tasks',
    action: 'create',
  },
  {
    key: 'portal.tasks.update',
    label: 'Cập nhật công việc',
    description: 'Cập nhật trạng thái và tiến độ công việc.',
    module: 'portal.tasks',
    action: 'update',
  },
  {
    key: 'portal.tickets.read',
    label: 'Xem ticket',
    description: 'Xem ticket hỗ trợ thuộc phạm vi truy cập của tài khoản.',
    module: 'portal.tickets',
    action: 'read',
  },
  {
    key: 'portal.tickets.read.all',
    label: 'Xem mọi ticket',
    description: 'Xem ticket hỗ trợ trên mọi tổ chức.',
    module: 'portal.tickets',
    action: 'read.all',
  },
  {
    key: 'portal.tickets.create',
    label: 'Tạo ticket',
    description: 'Tạo một yêu cầu hỗ trợ mới.',
    module: 'portal.tickets',
    action: 'create',
  },
  {
    key: 'portal.tickets.reply',
    label: 'Phản hồi ticket',
    description: 'Gửi phản hồi trong luồng trao đổi của ticket.',
    module: 'portal.tickets',
    action: 'reply',
  },
  {
    key: 'portal.tickets.manage',
    label: 'Điều phối ticket',
    description: 'Đổi trạng thái, người xử lý và tạo ghi chú nội bộ.',
    module: 'portal.tickets',
    action: 'manage',
  },
  {
    key: 'portal.documents.read',
    label: 'Xem tài liệu',
    description: 'Xem tài liệu thuộc phạm vi truy cập của tài khoản.',
    module: 'portal.documents',
    action: 'read',
  },
  {
    key: 'portal.documents.read.all',
    label: 'Xem mọi tài liệu',
    description: 'Xem tài liệu trên mọi tổ chức.',
    module: 'portal.documents',
    action: 'read.all',
  },
  {
    key: 'portal.documents.upload',
    label: 'Tải tài liệu lên',
    description: 'Thêm metadata tài liệu cho một tổ chức được phép truy cập.',
    module: 'portal.documents',
    action: 'upload',
  },
  {
    key: 'portal.documents.upload.all',
    label: 'Tải tài liệu lên mọi tổ chức',
    description: 'Thêm metadata tài liệu cho mọi tổ chức được quản lý.',
    module: 'portal.documents',
    action: 'upload.all',
  },
  {
    key: 'portal.documents.download',
    label: 'Tải tài liệu xuống',
    description: 'Tải xuống tài liệu thuộc phạm vi truy cập.',
    module: 'portal.documents',
    action: 'download',
  },
  {
    key: 'portal.contracts.read',
    label: 'Xem hợp đồng',
    description: 'Xem hợp đồng thuộc phạm vi truy cập của tài khoản.',
    module: 'portal.contracts',
    action: 'read',
  },
  {
    key: 'portal.contracts.read.all',
    label: 'Xem mọi hợp đồng',
    description: 'Xem hợp đồng trên mọi tổ chức.',
    module: 'portal.contracts',
    action: 'read.all',
  },
  {
    key: 'portal.contracts.download',
    label: 'Tải hợp đồng xuống',
    description: 'Tải xuống hợp đồng thuộc phạm vi truy cập.',
    module: 'portal.contracts',
    action: 'download',
  },
  {
    key: 'portal.invoices.read',
    label: 'Xem hóa đơn',
    description: 'Xem hóa đơn thuộc phạm vi truy cập của tài khoản.',
    module: 'portal.invoices',
    action: 'read',
  },
  {
    key: 'portal.invoices.read.all',
    label: 'Xem mọi hóa đơn',
    description: 'Xem hóa đơn trên mọi tổ chức.',
    module: 'portal.invoices',
    action: 'read.all',
  },
  {
    key: 'portal.invoices.download',
    label: 'Tải hóa đơn xuống',
    description: 'Tải xuống hóa đơn thuộc phạm vi truy cập.',
    module: 'portal.invoices',
    action: 'download',
  },
  {
    key: 'portal.notifications.read',
    label: 'Xem thông báo',
    description: 'Xem các thông báo được gửi tới tài khoản.',
    module: 'portal.notifications',
    action: 'read',
  },
  {
    key: 'portal.notifications.manage',
    label: 'Quản lý trạng thái thông báo',
    description: 'Đánh dấu thông báo của tài khoản là đã đọc.',
    module: 'portal.notifications',
    action: 'manage',
  },
  {
    key: 'portal.notifications.compose',
    label: 'Gửi thông báo cho khách hàng',
    description:
      'Gửi thông báo trực tiếp tới tài khoản khách hàng đang hoạt động.',
    module: 'portal.notifications',
    action: 'compose',
  },
  {
    key: 'portal.notifications.compose.all',
    label: 'Gửi thông báo cho mọi tài khoản',
    description: 'Gửi thông báo trực tiếp tới mọi tài khoản đang hoạt động.',
    module: 'portal.notifications',
    action: 'compose.all',
  },
  {
    key: 'portal.announcements.read',
    label: 'Xem bảng tin',
    description: 'Xem các thông báo vận hành đã công bố cho tài khoản.',
    module: 'portal.announcements',
    action: 'read',
  },
  {
    key: 'portal.announcements.manage',
    label: 'Quản lý bảng tin',
    description: 'Tạo và công bố thông báo vận hành trong Portal.',
    module: 'portal.announcements',
    action: 'manage',
  },
  {
    key: 'portal.profile.read',
    label: 'Xem hồ sơ',
    description: 'Xem hồ sơ của tài khoản đang đăng nhập.',
    module: 'portal.profile',
    action: 'read',
  },
  {
    key: 'portal.profile.update',
    label: 'Cập nhật hồ sơ',
    description: 'Cập nhật thông tin hồ sơ và mật khẩu tài khoản.',
    module: 'portal.profile',
    action: 'update',
  },
  {
    key: 'portal.settings.read',
    label: 'Xem cài đặt',
    description: 'Mở các tùy chọn cá nhân trong Portal.',
    module: 'portal.settings',
    action: 'read',
  },
  {
    key: 'portal.settings.update',
    label: 'Cập nhật cài đặt',
    description: 'Thay đổi các tùy chọn cá nhân trong Portal.',
    module: 'portal.settings',
    action: 'update',
  },
  {
    key: 'admin.access',
    label: 'Mở khu vực quản trị',
    description: 'Truy cập khu vực QTS Admin tách biệt.',
    module: 'admin',
    action: 'access',
  },
  {
    key: 'admin.dashboard.read',
    label: 'Xem tổng quan quản trị',
    description: 'Xem chỉ số tổng quan và tình trạng vận hành quản trị.',
    module: 'admin.dashboard',
    action: 'read',
  },
  {
    key: 'admin.users.read',
    label: 'Xem người dùng',
    description: 'Xem danh sách tài khoản trong khu vực quản trị.',
    module: 'admin.users',
    action: 'read',
  },
  {
    key: 'admin.users.update',
    label: 'Cập nhật người dùng',
    description: 'Thay đổi trạng thái hoạt động và role nền của tài khoản.',
    module: 'admin.users',
    action: 'update',
  },
  {
    key: 'admin.permissions.read',
    label: 'Xem chính sách quyền',
    description: 'Xem danh mục quyền và quyền hiệu lực của từng tài khoản.',
    module: 'admin.permissions',
    action: 'read',
  },
  {
    key: 'admin.permissions.manage',
    label: 'Điều chỉnh quyền tài khoản',
    description: 'Cho phép hoặc từ chối từng quyền riêng cho mỗi tài khoản.',
    module: 'admin.permissions',
    action: 'manage',
  },
  {
    key: 'admin.content.read',
    label: 'Xem nội dung CMS',
    description: 'Xem nội dung website công khai trong khu vực quản trị.',
    module: 'admin.content',
    action: 'read',
  },
  {
    key: 'admin.content.write',
    label: 'Biên tập nội dung CMS',
    description:
      'Tạo và cập nhật nội dung được quản lý trên website công khai.',
    module: 'admin.content',
    action: 'write',
  },
  {
    key: 'admin.audit.read',
    label: 'Xem nhật ký audit',
    description: 'Xem lại các sự kiện bảo mật và thao tác quản trị.',
    module: 'admin.audit',
    action: 'read',
  },
] as const

export type PermissionKey = (typeof PERMISSION_CATALOG)[number]['key']
export type PermissionDefinition = (typeof PERMISSION_CATALOG)[number]

const allPermissionKeys = PERMISSION_CATALOG.map(
  (item) => item.key,
) as PermissionKey[]

export const ROLE_DEFAULT_PERMISSION_KEYS: Record<
  RoleName,
  readonly PermissionKey[]
> = {
  ADMIN: allPermissionKeys,
  STAFF: [
    'portal.dashboard.read',
    'portal.projects.read',
    'portal.projects.create',
    'portal.projects.update',
    'portal.tasks.read',
    'portal.tasks.create',
    'portal.tasks.update',
    'portal.tickets.read',
    'portal.tickets.read.all',
    'portal.tickets.create',
    'portal.tickets.reply',
    'portal.tickets.manage',
    'portal.documents.read',
    'portal.documents.read.all',
    'portal.documents.upload',
    'portal.documents.download',
    'portal.contracts.read',
    'portal.contracts.read.all',
    'portal.contracts.download',
    'portal.invoices.read',
    'portal.invoices.read.all',
    'portal.invoices.download',
    'portal.notifications.read',
    'portal.notifications.manage',
    'portal.notifications.compose',
    'portal.announcements.read',
    'portal.profile.read',
    'portal.profile.update',
    'portal.settings.read',
    'portal.settings.update',
  ],
  CUSTOMER: [
    'portal.dashboard.read',
    'portal.projects.read',
    'portal.tasks.read',
    'portal.tickets.read',
    'portal.tickets.create',
    'portal.tickets.reply',
    'portal.documents.read',
    'portal.documents.download',
    'portal.contracts.read',
    'portal.contracts.download',
    'portal.invoices.read',
    'portal.invoices.download',
    'portal.notifications.read',
    'portal.notifications.manage',
    'portal.announcements.read',
    'portal.profile.read',
    'portal.profile.update',
    'portal.settings.read',
    'portal.settings.update',
  ],
}

const PERMISSION_IMPLICATIONS = {
  'portal.projects.read.all': ['portal.projects.read'],
  'portal.projects.assign.all': ['portal.projects.read'],
  'portal.projects.create': ['portal.projects.read'],
  'portal.projects.update': ['portal.projects.read'],
  'portal.projects.delete': ['portal.projects.read'],
  'portal.tasks.read.all': ['portal.tasks.read'],
  'portal.tasks.create': ['portal.tasks.read'],
  'portal.tasks.update': ['portal.tasks.read'],
  'portal.tickets.read.all': ['portal.tickets.read'],
  'portal.tickets.create': ['portal.tickets.read'],
  'portal.tickets.reply': ['portal.tickets.read'],
  'portal.tickets.manage': ['portal.tickets.read'],
  'portal.documents.read.all': ['portal.documents.read'],
  'portal.documents.upload': ['portal.documents.read'],
  'portal.documents.upload.all': [
    'portal.documents.upload',
    'portal.documents.read',
  ],
  'portal.documents.download': ['portal.documents.read'],
  'portal.contracts.read.all': ['portal.contracts.read'],
  'portal.contracts.download': ['portal.contracts.read'],
  'portal.invoices.read.all': ['portal.invoices.read'],
  'portal.invoices.download': ['portal.invoices.read'],
  'portal.notifications.manage': ['portal.notifications.read'],
  'portal.notifications.compose': ['portal.notifications.read'],
  'portal.notifications.compose.all': [
    'portal.notifications.compose',
    'portal.notifications.read',
  ],
  'portal.announcements.manage': ['portal.announcements.read'],
  'portal.profile.update': ['portal.profile.read'],
  'portal.settings.update': ['portal.settings.read'],
  'admin.dashboard.read': ['admin.access'],
  'admin.users.read': ['admin.access'],
  'admin.users.update': ['admin.users.read', 'admin.access'],
  'admin.permissions.read': ['admin.access'],
  'admin.permissions.manage': ['admin.permissions.read', 'admin.access'],
  'admin.content.read': ['admin.access'],
  'admin.content.write': ['admin.content.read', 'admin.access'],
  'admin.audit.read': ['admin.access'],
} as const satisfies Partial<Record<PermissionKey, readonly PermissionKey[]>>

export function expandPermissionKeys(keys: Iterable<string>) {
  const expanded = new Set<string>(keys)
  let changed = true
  while (changed) {
    changed = false
    for (const [source, implied] of Object.entries(PERMISSION_IMPLICATIONS)) {
      if (!expanded.has(source)) continue
      for (const key of implied) {
        if (expanded.has(key)) continue
        expanded.add(key)
        changed = true
      }
    }
  }
  return expanded
}

/** Remove capabilities whose prerequisites were explicitly denied. */
export function applyPermissionDenials(
  keys: Set<string>,
  deniedKeys: Iterable<string>,
) {
  const blocked = new Set(deniedKeys)
  let changed = true
  while (changed) {
    changed = false
    for (const [source, implied] of Object.entries(PERMISSION_IMPLICATIONS)) {
      if (!keys.has(source)) continue
      if (!implied.some((key) => blocked.has(key))) continue
      keys.delete(source)
      blocked.add(source)
      changed = true
    }
  }
  for (const key of blocked) keys.delete(key)
  return keys
}

export type PermissionSubject = {
  role: RoleName
  permissions?: readonly string[]
  permissionKeys?: readonly string[]
}

/** Resolve an effective permission from explicit account overrides first. */
export function hasPermission(
  subject: PermissionSubject,
  key: PermissionKey | string,
) {
  const keys = subject.permissionKeys ?? subject.permissions
  if (keys) return keys.includes(key)
  return expandPermissionKeys(ROLE_DEFAULT_PERMISSION_KEYS[subject.role]).has(
    key,
  )
}

export function permissionForPortalRoute(
  pathname: string,
): PermissionKey | null {
  const adminPath = pathname.startsWith('/portal/admin')
    ? pathname.replace(/^\/portal\/admin/, '/admin') || '/admin'
    : pathname
  if (adminPath === '/admin') return 'admin.dashboard.read'
  if (adminPath === '/admin/users' || adminPath.startsWith('/admin/users/')) {
    return 'admin.users.read'
  }
  if (adminPath === '/admin/roles' || adminPath.startsWith('/admin/roles/')) {
    return 'admin.permissions.read'
  }
  if (
    adminPath === '/admin/content' ||
    adminPath.startsWith('/admin/content/')
  ) {
    return 'admin.content.read'
  }
  if (
    adminPath === '/admin/audit-logs' ||
    adminPath.startsWith('/admin/audit-logs/')
  ) {
    return 'admin.audit.read'
  }
  const routeMap: Array<[string, PermissionKey]> = [
    ['/portal/dashboard', 'portal.dashboard.read'],
    ['/portal/projects', 'portal.projects.read'],
    ['/portal/tasks', 'portal.tasks.read'],
    ['/portal/tickets', 'portal.tickets.read'],
    ['/portal/documents', 'portal.documents.read'],
    ['/portal/contracts', 'portal.contracts.read'],
    ['/portal/invoices', 'portal.invoices.read'],
    ['/portal/notifications', 'portal.notifications.read'],
    ['/portal/announcements', 'portal.announcements.read'],
    ['/portal/profile', 'portal.profile.read'],
    ['/portal/settings', 'portal.settings.read'],
  ]
  return (
    routeMap.find(
      ([route]) => pathname === route || pathname.startsWith(`${route}/`),
    )?.[1] ?? null
  )
}

export function canAccessPortalRoute(
  subject: RoleName | PermissionSubject,
  pathname: string,
) {
  const permission = permissionForPortalRoute(pathname)
  if (!permission) return false
  return hasPermission(
    typeof subject === 'string' ? { role: subject } : subject,
    permission,
  )
}

export function canAccessOrganization(
  subject: RoleName | PermissionSubject,
  userOrganizationId: string | null,
  resourceOrganizationId: string,
) {
  const permissions = subjectOrRole(subject)
  if (
    hasPermission(permissions, 'portal.projects.read.all') ||
    hasPermission(permissions, 'portal.projects.assign.all')
  ) {
    return true
  }
  return Boolean(
    userOrganizationId && userOrganizationId === resourceOrganizationId,
  )
}

function subjectOrRole(
  subject: RoleName | PermissionSubject,
): PermissionSubject {
  return typeof subject === 'string' ? { role: subject } : subject
}

export function canManageBlog(subject: RoleName | PermissionSubject) {
  return hasPermission(subjectOrRole(subject), 'admin.content.write')
}

export function canManageProjects(subject: RoleName | PermissionSubject) {
  return hasPermission(subjectOrRole(subject), 'portal.projects.update')
}

export function canManageTasks(subject: RoleName | PermissionSubject) {
  return hasPermission(subjectOrRole(subject), 'portal.tasks.update')
}

export function canManageTicketStatus(subject: RoleName | PermissionSubject) {
  return hasPermission(subjectOrRole(subject), 'portal.tickets.manage')
}
