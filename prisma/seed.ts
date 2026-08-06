import 'dotenv/config'

import path from 'node:path'

import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3'
import { hash } from 'bcryptjs'

import { PrismaClient } from '../src/generated/prisma/client'
import {
  PERMISSION_CATALOG,
  ROLE_DEFAULT_PERMISSION_KEYS,
  type RoleName,
} from '../src/lib/domain/permissions'

const databaseUrl = process.env.DATABASE_URL

if (!databaseUrl) {
  throw new Error('DATABASE_URL chưa được cấu hình.')
}

if (process.env.SEED_DEMO !== 'true' || process.env.NODE_ENV === 'production') {
  throw new Error(
    'Seed demo bị khóa. Đặt SEED_DEMO=true và không chạy với NODE_ENV=production.',
  )
}

const adapterUrl = databaseUrl.startsWith('file:./')
  ? `file:${path.resolve(process.cwd(), 'prisma', databaseUrl.slice(7)).replaceAll('\\', '/')}`
  : databaseUrl
const adapter = new PrismaBetterSqlite3({ url: adapterUrl })
const prisma = new PrismaClient({ adapter })

function daysFromNow(days: number) {
  const date = new Date()
  date.setHours(9, 0, 0, 0)
  date.setDate(date.getDate() + days)
  return date
}

function permissionId(key: string) {
  return `permission-${key.replaceAll('.', '-')}`
}

async function resetDemoData() {
  await prisma.$transaction(async (tx) => {
    await tx.auditLog.deleteMany()
    await tx.siteSetting.deleteMany()
    await tx.notification.deleteMany()
    await tx.ticketMessage.deleteMany()
    await tx.ticket.deleteMany()
    await tx.taskComment.deleteMany()
    await tx.task.deleteMany()
    await tx.milestone.deleteMany()
    await tx.projectMember.deleteMany()
    await tx.document.deleteMany()
    await tx.contract.deleteMany()
    await tx.invoice.deleteMany()
    await tx.project.deleteMany()
    await tx.session.deleteMany()
    await tx.blogPost.deleteMany()
    await tx.announcement.deleteMany()
    await tx.service.deleteMany()
    await tx.caseStudy.deleteMany()
    await tx.contactLead.deleteMany()
    await tx.quoteRequest.deleteMany()
    await tx.userPermission.deleteMany()
    await tx.user.deleteMany()
    await tx.rolePermission.deleteMany()
    await tx.permission.deleteMany()
    await tx.organization.deleteMany()
    await tx.role.deleteMany()
  })
}

async function seed() {
  const passwordHashes = Promise.all([
    hash('QtsAdmin123!', 12),
    hash('QtsStaff123!', 12),
    hash('QtsCustomer123!', 12),
  ])

  await resetDemoData()

  const [adminRole, staffRole, customerRole, passwords] = await Promise.all([
    prisma.role.create({
      data: { id: 'role-admin', name: 'ADMIN', label: 'Quản trị viên' },
    }),
    prisma.role.create({
      data: { id: 'role-staff', name: 'STAFF', label: 'Nhân sự QTS' },
    }),
    prisma.role.create({
      data: { id: 'role-customer', name: 'CUSTOMER', label: 'Khách hàng' },
    }),
    passwordHashes,
  ])
  const [adminPassword, staffPassword, customerPassword] = passwords

  await prisma.permission.createMany({
    data: PERMISSION_CATALOG.map((permission) => ({
      id: permissionId(permission.key),
      key: permission.key,
      label: permission.label,
      description: permission.description,
      module: permission.module,
      action: permission.action,
    })),
  })

  const rolesByName: Record<RoleName, { id: string }> = {
    ADMIN: adminRole,
    STAFF: staffRole,
    CUSTOMER: customerRole,
  }
  await prisma.rolePermission.createMany({
    data: (
      Object.entries(ROLE_DEFAULT_PERMISSION_KEYS) as Array<
        [RoleName, readonly string[]]
      >
    ).flatMap(([roleName, keys]) =>
      keys.map((key) => ({
        roleId: rolesByName[roleName].id,
        permissionId: permissionId(key),
        effect: 'ALLOW' as const,
      })),
    ),
  })

  const [qtsOrganization, demoOrganization] = await Promise.all([
    prisma.organization.create({
      data: {
        id: 'org-qts',
        name: 'QTS Technology',
        slug: 'qts-technology',
      },
    }),
    prisma.organization.create({
      data: {
        id: 'org-demo-client',
        name: 'Doanh nghiệp minh họa',
        slug: 'doanh-nghiep-demo',
      },
    }),
  ])

  const [admin, staff, customer] = await Promise.all([
    prisma.user.create({
      data: {
        id: 'user-admin',
        email: 'admin@qts.local',
        passwordHash: adminPassword,
        name: 'Quản trị viên demo',
        title: 'Quản trị hệ thống',
        roleId: adminRole.id,
        organizationId: qtsOrganization.id,
      },
    }),
    prisma.user.create({
      data: {
        id: 'user-staff',
        email: 'staff@qts.local',
        passwordHash: staffPassword,
        name: 'Nhân sự QTS demo',
        title: 'Điều phối dự án',
        roleId: staffRole.id,
        organizationId: qtsOrganization.id,
      },
    }),
    prisma.user.create({
      data: {
        id: 'user-customer',
        email: 'customer@qts.local',
        passwordHash: customerPassword,
        name: 'Khách hàng demo',
        title: 'Đại diện doanh nghiệp',
        roleId: customerRole.id,
        organizationId: demoOrganization.id,
      },
    }),
  ])

  const [project] = await Promise.all([
    prisma.project.create({
      data: {
        id: 'project-demo-portal',
        code: 'QTS-2026-001',
        name: 'Cổng vận hành doanh nghiệp demo',
        description:
          'Kịch bản minh họa quy trình theo dõi tiến độ, tài liệu và hỗ trợ trong QTS Portal.',
        status: 'ACTIVE',
        priority: 'HIGH',
        progress: 58,
        startDate: daysFromNow(-55),
        dueDate: daysFromNow(45),
        organizationId: demoOrganization.id,
        createdById: staff.id,
      },
    }),
    prisma.project.create({
      data: {
        id: 'project-internal-qts',
        code: 'QTS-INT-001',
        name: 'Không gian nội bộ QTS',
        description:
          'Bản ghi phục vụ kiểm thử phân tách dữ liệu giữa các tổ chức.',
        status: 'PLANNING',
        priority: 'LOW',
        progress: 10,
        organizationId: qtsOrganization.id,
        createdById: admin.id,
      },
    }),
  ])

  await prisma.projectMember.createMany({
    data: [
      {
        id: 'member-demo-staff',
        projectId: project.id,
        userId: staff.id,
        title: 'Điều phối dự án',
      },
      {
        id: 'member-demo-customer',
        projectId: project.id,
        userId: customer.id,
        title: 'Đại diện khách hàng',
      },
    ],
  })

  const [discovery, delivery] = await Promise.all([
    prisma.milestone.create({
      data: {
        id: 'milestone-discovery',
        projectId: project.id,
        name: 'Khảo sát và thiết kế giải pháp',
        description: 'Thống nhất phạm vi, luồng nghiệp vụ và nguyên mẫu.',
        status: 'COMPLETED',
        progress: 100,
        dueDate: daysFromNow(-28),
      },
    }),
    prisma.milestone.create({
      data: {
        id: 'milestone-delivery',
        projectId: project.id,
        name: 'Phát triển và kiểm thử',
        description: 'Triển khai các module theo thứ tự ưu tiên đã thống nhất.',
        status: 'IN_PROGRESS',
        progress: 52,
        dueDate: daysFromNow(24),
      },
    }),
  ])

  const completedTask = await prisma.task.create({
    data: {
      id: 'task-demo-complete',
      projectId: project.id,
      milestoneId: discovery.id,
      title: 'Duyệt luồng nghiệp vụ cốt lõi',
      description: 'Xác nhận vai trò, trạng thái và điểm kiểm soát dữ liệu.',
      status: 'DONE',
      priority: 'HIGH',
      progress: 100,
      assigneeId: staff.id,
      createdById: staff.id,
      dueDate: daysFromNow(-30),
    },
  })
  await prisma.task.createMany({
    data: [
      {
        id: 'task-demo-progress',
        projectId: project.id,
        milestoneId: delivery.id,
        title: 'Hoàn thiện dashboard theo vai trò',
        description: 'Hiển thị dữ liệu phù hợp cho ADMIN, STAFF và CUSTOMER.',
        status: 'IN_PROGRESS',
        priority: 'HIGH',
        progress: 64,
        assigneeId: staff.id,
        createdById: staff.id,
        dueDate: daysFromNow(7),
      },
      {
        id: 'task-demo-review',
        projectId: project.id,
        milestoneId: delivery.id,
        title: 'Rà soát quy trình hỗ trợ',
        description: 'Kiểm thử tạo, trao đổi và đóng yêu cầu hỗ trợ.',
        status: 'REVIEW',
        priority: 'MEDIUM',
        progress: 72,
        assigneeId: staff.id,
        createdById: staff.id,
        dueDate: daysFromNow(11),
      },
      {
        id: 'task-demo-todo',
        projectId: project.id,
        milestoneId: delivery.id,
        title: 'Chuẩn bị hướng dẫn bàn giao',
        description: 'Tổng hợp tài liệu sử dụng và đầu mối hỗ trợ.',
        status: 'TODO',
        priority: 'MEDIUM',
        progress: 0,
        assigneeId: staff.id,
        createdById: staff.id,
        dueDate: daysFromNow(25),
      },
    ],
  })

  await prisma.taskComment.create({
    data: {
      id: 'comment-demo-1',
      taskId: completedTask.id,
      authorId: customer.id,
      content: 'Luồng nghiệp vụ mẫu đã được xác nhận trong môi trường demo.',
    },
  })

  const ticket = await prisma.ticket.create({
    data: {
      id: 'ticket-demo-1',
      code: 'TK-2026-001',
      subject: 'Cần hỗ trợ kiểm tra dữ liệu dashboard',
      description:
        'Một chỉ số mẫu trên dashboard chưa phản ánh bản cập nhật gần nhất.',
      category: 'TECHNICAL',
      priority: 'HIGH',
      status: 'NEW',
      organizationId: demoOrganization.id,
      projectId: project.id,
      createdById: customer.id,
      assignedToId: staff.id,
    },
  })
  await prisma.ticketMessage.createMany({
    data: [
      {
        id: 'ticket-message-demo-1',
        ticketId: ticket.id,
        authorId: customer.id,
        content: 'Nhờ đội ngũ QTS kiểm tra giúp bản ghi mẫu này.',
      },
      {
        id: 'ticket-message-demo-2',
        ticketId: ticket.id,
        authorId: staff.id,
        content: 'QTS đã tiếp nhận và đang đối chiếu dữ liệu nguồn.',
      },
    ],
  })

  await prisma.document.createMany({
    data: [
      {
        id: 'document-demo-1',
        name: 'Tài liệu phạm vi dự án mẫu',
        type: 'PROJECT_SCOPE',
        fileName: 'pham-vi-du-an-mau.txt',
        mimeType: 'text/plain',
        size: 2048,
        url: '/api/documents/document-demo-1/download',
        organizationId: demoOrganization.id,
        projectId: project.id,
        uploadedById: staff.id,
      },
      {
        id: 'document-demo-2',
        name: 'Biên bản xác nhận demo',
        type: 'MINUTES',
        fileName: 'bien-ban-xac-nhan-demo.txt',
        mimeType: 'text/plain',
        size: 1536,
        url: '/api/documents/document-demo-2/download',
        organizationId: demoOrganization.id,
        projectId: project.id,
        uploadedById: staff.id,
      },
    ],
  })

  await prisma.contract.create({
    data: {
      id: 'contract-demo-1',
      code: 'HD-DEMO-001',
      title: 'Hợp đồng dịch vụ mẫu',
      status: 'ACTIVE',
      value: 0,
      currency: 'VND',
      signedAt: daysFromNow(-60),
      expiresAt: daysFromNow(120),
      url: '/api/contracts/contract-demo-1/download',
      organizationId: demoOrganization.id,
      projectId: project.id,
    },
  })

  await prisma.invoice.createMany({
    data: [
      {
        id: 'invoice-demo-paid',
        code: 'INV-DEMO-001',
        title: 'Đợt thanh toán mẫu 01',
        status: 'PAID',
        amount: 0,
        dueDate: daysFromNow(-25),
        paidAt: daysFromNow(-27),
        organizationId: demoOrganization.id,
        projectId: project.id,
      },
      {
        id: 'invoice-demo-sent',
        code: 'INV-DEMO-002',
        title: 'Đợt thanh toán mẫu 02',
        status: 'SENT',
        amount: 0,
        dueDate: daysFromNow(18),
        organizationId: demoOrganization.id,
        projectId: project.id,
      },
    ],
  })

  await prisma.notification.createMany({
    data: [
      {
        id: 'notification-customer-1',
        userId: customer.id,
        title: 'Ticket đã được tiếp nhận',
        message: 'Yêu cầu TK-2026-001 đã có nhân sự phụ trách.',
        type: 'SUCCESS',
        href: `/portal/tickets/${ticket.id}`,
      },
      {
        id: 'notification-staff-1',
        userId: staff.id,
        title: 'Yêu cầu ưu tiên cao',
        message: 'TK-2026-001 đang chờ cập nhật trạng thái.',
        type: 'ACTION_REQUIRED',
        href: `/portal/tickets/${ticket.id}`,
      },
    ],
  })

  await prisma.announcement.create({
    data: {
      id: 'announcement-demo-1',
      title: 'Lịch bảo trì môi trường demo',
      content:
        'Thông báo mẫu minh họa khu vực cập nhật vận hành. Thời gian thực tế sẽ được QTS xác nhận qua kênh chính thức.',
      audience: 'ALL',
      active: true,
      publishedAt: daysFromNow(-2),
      createdById: admin.id,
    },
  })

  await prisma.service.createMany({
    data: [
      {
        id: 'service-web',
        slug: 'thiet-ke-website',
        name: 'Thiết kế website',
        summary: 'Trải nghiệm số rõ ràng, nhanh và dễ quản trị.',
        description:
          'Tư vấn, thiết kế và triển khai website theo mục tiêu vận hành của tổ chức.',
        order: 1,
      },
      {
        id: 'service-software',
        slug: 'phat-trien-phan-mem',
        name: 'Phát triển phần mềm',
        summary: 'Hệ thống nghiệp vụ được xây theo quy trình thực tế.',
        description:
          'Phân tích, xây dựng và cải tiến phần mềm doanh nghiệp theo từng giai đoạn.',
        order: 2,
      },
      {
        id: 'service-integration',
        slug: 'tich-hop-he-thong',
        name: 'Tích hợp hệ thống',
        summary: 'Kết nối dữ liệu và giảm thao tác rời rạc.',
        description:
          'Thiết kế luồng tích hợp có kiểm soát giữa các nền tảng đang vận hành.',
        order: 3,
      },
      {
        id: 'service-operations',
        slug: 'bao-tri-van-hanh',
        name: 'Bảo trì & vận hành',
        summary: 'Theo dõi, hỗ trợ và cải tiến sau bàn giao.',
        description:
          'Duy trì tính ổn định, xử lý yêu cầu và cập nhật theo kế hoạch thống nhất.',
        order: 4,
      },
    ],
  })

  await prisma.caseStudy.createMany({
    data: [
      {
        id: 'case-study-demo-1',
        slug: 'nen-tang-van-hanh-doanh-nghiep-mau',
        title: 'Nền tảng vận hành doanh nghiệp',
        excerpt:
          'Tình huống minh họa cách QTS tiếp cận một hệ thống có nhiều vai trò và luồng phê duyệt.',
        challenge:
          'Một hệ thống vận hành cần phân tách quyền truy cập, phối hợp nhiều vai trò và lưu lịch sử phê duyệt trong cùng một luồng.',
        solution:
          'Minh họa kiến trúc module, phân quyền theo tổ chức và lộ trình bàn giao theo mốc.',
        outcome:
          'Đầu ra minh họa gồm sơ đồ vai trò, danh mục module và kế hoạch bàn giao theo mốc.',
        industry: 'Doanh nghiệp',
        featured: true,
        publishedAt: daysFromNow(-18),
      },
      {
        id: 'case-study-demo-2',
        slug: 'cong-thong-tin-giao-duc-mau',
        title: 'Cổng thông tin giáo dục',
        excerpt:
          'Tình huống minh họa trải nghiệm tra cứu, quản trị nội dung và tích hợp dữ liệu.',
        challenge:
          'Một cổng thông tin cần giúp người dùng tra cứu nội dung rõ ràng, đồng thời giữ quy trình biên tập và dữ liệu tích hợp có kiểm soát.',
        solution:
          'Minh họa cấu trúc nội dung dễ tìm, vai trò biên tập và các điểm tích hợp có giám sát.',
        outcome:
          'Đầu ra minh họa gồm cây nội dung, quy trình biên tập và bản đồ các điểm tích hợp.',
        industry: 'Giáo dục',
        publishedAt: daysFromNow(-12),
      },
      {
        id: 'case-study-demo-3',
        slug: 'thuong-mai-va-quan-ly-don-hang-mau',
        title: 'Website thương mại và quản lý đơn hàng',
        excerpt:
          'Tình huống minh họa cách kết nối trải nghiệm mua hàng với quy trình xử lý đơn và báo cáo vận hành.',
        challenge:
          'Một website thương mại cần liên kết hành trình mua hàng với trạng thái xử lý đơn và dữ liệu phục vụ vận hành.',
        solution:
          'Minh họa luồng đặt hàng, kiểm soát trạng thái và bảng theo dõi dữ liệu tập trung.',
        outcome:
          'Đầu ra minh họa gồm hành trình đặt hàng, bộ trạng thái và góc nhìn dữ liệu vận hành.',
        industry: 'Thương mại',
        publishedAt: daysFromNow(-6),
      },
    ],
  })

  await prisma.blogPost.createMany({
    data: [
      {
        id: 'blog-demo-published',
        slug: 'chon-lo-trinh-chuyen-doi-so-phu-hop',
        title: 'Cách chọn lộ trình chuyển đổi số phù hợp với vận hành',
        excerpt:
          'Bắt đầu từ nút thắt nghiệp vụ, dữ liệu cần tin cậy và khả năng tiếp nhận thay đổi của đội ngũ.',
        content:
          'Chuyển đổi số hiệu quả không bắt đầu bằng danh sách công nghệ. Điểm xuất phát nên là một luồng nghiệp vụ cụ thể đang tạo ra chậm trễ, sai lệch hoặc khó quan sát.\n\nSau khi xác định mục tiêu, doanh nghiệp cần thống nhất chủ sở hữu dữ liệu, tiêu chí nghiệm thu và một giai đoạn triển khai đủ nhỏ để học nhanh.\n\nQTS đề xuất đánh giá theo từng mốc, giữ dữ liệu có thể kiểm chứng và chỉ mở rộng khi quy trình mới đã được sử dụng ổn định.',
        status: 'PUBLISHED',
        metaTitle: 'Chọn lộ trình chuyển đổi số theo vận hành | QTS',
        metaDescription:
          'Các nguyên tắc xác định bài toán, dữ liệu và mốc triển khai cho một lộ trình chuyển đổi số thực tế.',
        publishedAt: daysFromNow(-8),
        authorId: admin.id,
      },
      {
        id: 'blog-demo-security',
        slug: 'bao-mat-theo-tung-lop-trong-phan-mem-doanh-nghiep',
        title: 'Bảo mật theo từng lớp trong phần mềm doanh nghiệp',
        excerpt:
          'Một cách nhìn thực tế về xác thực, phân quyền, giới hạn dữ liệu và khả năng truy vết thao tác.',
        content:
          'Bảo mật ứng dụng không nằm ở một cơ chế đơn lẻ. Hệ thống cần kiểm soát từ đầu vào, phiên đăng nhập, quyền trên từng tài nguyên đến nhật ký thao tác.\n\nVới dữ liệu nhiều tổ chức, mọi truy vấn phải mang theo phạm vi truy cập từ phía máy chủ. Việc chỉ ẩn nút trên giao diện không thể thay thế kiểm tra quyền.\n\nCác điểm kiểm soát nên có kiểm thử hồi quy để ngăn lỗi phân quyền quay trở lại khi sản phẩm mở rộng.',
        status: 'PUBLISHED',
        metaTitle: 'Bảo mật nhiều lớp cho phần mềm doanh nghiệp | QTS',
        metaDescription:
          'Các lớp kiểm soát thực tế cho xác thực, phân quyền và dữ liệu trong phần mềm doanh nghiệp.',
        publishedAt: daysFromNow(-5),
        authorId: admin.id,
      },
      {
        id: 'blog-demo-ux',
        slug: 'thiet-ke-trai-nghiem-cho-cong-cu-van-hanh',
        title: 'Thiết kế trải nghiệm cho công cụ vận hành nội bộ',
        excerpt:
          'Ưu tiên khả năng quét thông tin, thao tác lặp lại và phản hồi trạng thái rõ ràng cho người dùng nghiệp vụ.',
        content:
          'Công cụ vận hành cần giúp người dùng nhận ra việc cần làm tiếp theo trong thời gian ngắn. Mật độ thông tin có thể cao, nhưng cấu trúc, nhãn và trạng thái phải nhất quán.\n\nThiết kế tốt giảm số lần chuyển màn hình, giữ hành động chính gần dữ liệu liên quan và luôn phản hồi khi hệ thống đang xử lý.\n\nKhả năng truy cập bằng bàn phím, độ tương phản và bố cục trên màn hình nhỏ cần được kiểm tra như một phần của luồng nghiệp vụ.',
        status: 'PUBLISHED',
        metaTitle: 'Thiết kế UX cho công cụ vận hành | QTS',
        metaDescription:
          'Nguyên tắc thiết kế trải nghiệm rõ ràng và hiệu quả cho phần mềm vận hành nội bộ.',
        publishedAt: daysFromNow(-3),
        authorId: admin.id,
      },
      {
        id: 'blog-demo-draft',
        slug: 'checklist-ban-giao-phan-mem',
        title: 'Checklist bàn giao phần mềm cho đội vận hành',
        excerpt:
          'Bản nháp về tài liệu, quyền truy cập, dữ liệu và quy trình hỗ trợ sau bàn giao.',
        content:
          'Bản nháp nội dung dành cho quy trình duyệt bài trong khu vực quản trị.',
        status: 'DRAFT',
        authorId: admin.id,
      },
    ],
  })

  await prisma.auditLog.createMany({
    data: [
      {
        id: 'audit-demo-1',
        userId: admin.id,
        action: 'SEED_DEMO_DATA',
        entity: 'System',
        metadata: { source: 'prisma/seed.ts', demo: true },
      },
      {
        id: 'audit-demo-2',
        userId: staff.id,
        action: 'ASSIGN_TICKET',
        entity: 'Ticket',
        entityId: ticket.id,
        metadata: { assignedTo: staff.id },
      },
    ],
  })

  await prisma.siteSetting.createMany({
    data: [
      {
        id: 'setting-home-cta-title',
        key: 'homepage_final_cta_title',
        label: 'Tiêu đề CTA cuối trang chủ',
        value: 'Bắt đầu dự án công nghệ cùng QTS',
      },
      {
        id: 'setting-home-cta-description',
        key: 'homepage_final_cta_description',
        label: 'Mô tả CTA cuối trang chủ',
        value:
          'Chia sẻ bài toán và bối cảnh hiện tại. QTS sẽ phản hồi để cùng xác định phạm vi trao đổi tiếp theo, chưa phải cam kết báo giá tự động.',
      },
    ],
  })

  console.info('Đã tạo dữ liệu demo QTS cho ADMIN, STAFF và CUSTOMER.')
}

seed()
  .catch((error: unknown) => {
    console.error('Không thể seed dữ liệu demo.', error)
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
