import { z } from 'zod'

const email = z
  .string({ error: 'Vui lòng nhập email.' })
  .trim()
  .email('Email chưa đúng định dạng.')
  .max(160, 'Email không được vượt quá 160 ký tự.')
  .transform((value) => value.toLowerCase())

const phone = z
  .string({ error: 'Vui lòng nhập số điện thoại.' })
  .trim()
  .regex(
    /^(?:\+?84|0)[0-9][0-9 .-]{7,13}$/,
    'Số điện thoại chưa đúng định dạng.',
  )

const honeypot = z
  .string()
  .trim()
  .max(0, 'Yêu cầu không hợp lệ.')
  .optional()
  .default('')

const consent = z.boolean().refine((value) => value, {
  error: 'Bạn cần đồng ý chính sách dữ liệu trước khi gửi.',
})

export const loginSchema = z.object({
  email,
  password: z
    .string({ error: 'Vui lòng nhập mật khẩu.' })
    .min(8, 'Mật khẩu phải có ít nhất 8 ký tự.')
    .max(128, 'Mật khẩu không được vượt quá 128 ký tự.'),
})

export const forgotPasswordSchema = z.object({ email })

export const contactSchema = z.object({
  name: z
    .string({ error: 'Vui lòng nhập họ và tên.' })
    .trim()
    .min(2, 'Họ và tên phải có ít nhất 2 ký tự.')
    .max(80, 'Họ và tên không được vượt quá 80 ký tự.'),
  email,
  phone,
  company: z
    .string()
    .trim()
    .max(120, 'Tên đơn vị không được vượt quá 120 ký tự.')
    .optional()
    .default(''),
  message: z
    .string({ error: 'Vui lòng mô tả nhu cầu.' })
    .trim()
    .min(20, 'Nội dung cần có ít nhất 20 ký tự.')
    .max(2000, 'Nội dung không được vượt quá 2.000 ký tự.'),
  website: honeypot,
  consent,
})

export const quoteSchema = z.object({
  name: z
    .string({ error: 'Vui lòng nhập họ và tên.' })
    .trim()
    .min(2, 'Họ và tên phải có ít nhất 2 ký tự.')
    .max(80, 'Họ và tên không được vượt quá 80 ký tự.'),
  email,
  phone,
  company: z
    .string({ error: 'Vui lòng nhập tên đơn vị.' })
    .trim()
    .min(2, 'Tên đơn vị phải có ít nhất 2 ký tự.')
    .max(120, 'Tên đơn vị không được vượt quá 120 ký tự.'),
  service: z
    .string({ error: 'Vui lòng chọn dịch vụ.' })
    .trim()
    .min(2, 'Vui lòng chọn dịch vụ.'),
  budget: z
    .string({ error: 'Vui lòng chọn khoảng ngân sách.' })
    .trim()
    .min(2, 'Vui lòng chọn khoảng ngân sách.'),
  timeline: z
    .string({ error: 'Vui lòng chọn thời gian dự kiến.' })
    .trim()
    .min(2, 'Vui lòng chọn thời gian dự kiến.'),
  needs: z
    .string({ error: 'Vui lòng mô tả nhu cầu.' })
    .trim()
    .min(30, 'Nội dung cần có ít nhất 30 ký tự.')
    .max(3000, 'Nội dung không được vượt quá 3.000 ký tự.'),
  website: honeypot,
  consent,
})

export const ticketSchema = z.object({
  subject: z
    .string({ error: 'Vui lòng nhập tiêu đề.' })
    .trim()
    .min(5, 'Tiêu đề phải có ít nhất 5 ký tự.')
    .max(140, 'Tiêu đề không được vượt quá 140 ký tự.'),
  category: z.enum(['TECHNICAL', 'ACCOUNT', 'BILLING', 'OTHER'], {
    error: 'Vui lòng chọn nhóm yêu cầu.',
  }),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT'], {
    error: 'Vui lòng chọn mức ưu tiên.',
  }),
  description: z
    .string({ error: 'Vui lòng mô tả vấn đề.' })
    .trim()
    .min(20, 'Mô tả cần có ít nhất 20 ký tự.')
    .max(4000, 'Mô tả không được vượt quá 4.000 ký tự.'),
  projectId: z.string().trim().max(80).optional().default(''),
})

const optionalDate = z
  .union([
    z
      .string()
      .trim()
      .regex(/^\d{4}-\d{2}-\d{2}$/, 'Ngày chưa đúng định dạng.'),
    z.literal(''),
  ])
  .optional()
  .default('')

export const projectSchema = z
  .object({
    code: z
      .string({ error: 'Vui lòng nhập mã dự án.' })
      .trim()
      .min(3, 'Mã dự án phải có ít nhất 3 ký tự.')
      .max(30, 'Mã dự án không được vượt quá 30 ký tự.')
      .regex(/^[A-Za-z0-9-]+$/, 'Mã dự án chỉ gồm chữ, số và dấu gạch ngang.')
      .transform((value) => value.toUpperCase()),
    name: z
      .string({ error: 'Vui lòng nhập tên dự án.' })
      .trim()
      .min(5, 'Tên dự án phải có ít nhất 5 ký tự.')
      .max(160, 'Tên dự án không được vượt quá 160 ký tự.'),
    description: z
      .string({ error: 'Vui lòng mô tả dự án.' })
      .trim()
      .min(20, 'Mô tả phải có ít nhất 20 ký tự.')
      .max(4000, 'Mô tả không được vượt quá 4.000 ký tự.'),
    organizationId: z.string().trim().min(1, 'Vui lòng chọn khách hàng.'),
    status: z.enum(['PLANNING', 'ACTIVE', 'ON_HOLD', 'COMPLETED', 'CANCELLED']),
    priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']),
    progress: z.coerce.number().int().min(0).max(100),
    startDate: optionalDate,
    dueDate: optionalDate,
  })
  .refine(
    (value) =>
      !value.startDate ||
      !value.dueDate ||
      new Date(value.startDate) <= new Date(value.dueDate),
    { path: ['dueDate'], error: 'Ngày hoàn thành phải sau ngày bắt đầu.' },
  )

export const taskSchema = z.object({
  projectId: z.string().trim().min(1, 'Vui lòng chọn dự án.'),
  title: z
    .string({ error: 'Vui lòng nhập tên công việc.' })
    .trim()
    .min(5, 'Tên công việc phải có ít nhất 5 ký tự.')
    .max(180, 'Tên công việc không được vượt quá 180 ký tự.'),
  description: z.string().trim().max(3000).optional().default(''),
  status: z.enum(['TODO', 'IN_PROGRESS', 'REVIEW', 'BLOCKED', 'DONE']),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']),
  progress: z.coerce.number().int().min(0).max(100),
  assigneeId: z.string().trim().max(80).optional().default(''),
  milestoneId: z.string().trim().max(80).optional().default(''),
  dueDate: optionalDate,
})

export const taskUpdateSchema = z.object({
  status: z.enum(['TODO', 'IN_PROGRESS', 'REVIEW', 'BLOCKED', 'DONE']),
  progress: z.coerce.number().int().min(0).max(100),
})

export const ticketMessageSchema = z.object({
  content: z
    .string({ error: 'Vui lòng nhập nội dung phản hồi.' })
    .trim()
    .min(2, 'Phản hồi phải có ít nhất 2 ký tự.')
    .max(4000, 'Phản hồi không được vượt quá 4.000 ký tự.'),
  internal: z.boolean().optional().default(false),
})

export const ticketStatusSchema = z.object({
  status: z.enum([
    'NEW',
    'ACKNOWLEDGED',
    'IN_PROGRESS',
    'WAITING_CUSTOMER',
    'RESOLVED',
    'CLOSED',
  ]),
  assignedToId: z.string().trim().max(80).optional(),
})

export const documentSchema = z.object({
  name: z
    .string()
    .trim()
    .min(3, 'Tên tài liệu phải có ít nhất 3 ký tự.')
    .max(160),
  type: z.string().trim().min(2, 'Vui lòng chọn loại tài liệu.').max(60),
  fileName: z.string().trim().min(1, 'Vui lòng chọn tệp.').max(180),
  mimeType: z.enum([
    'application/pdf',
    'text/plain',
    'image/png',
    'image/jpeg',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  ]),
  size: z.coerce
    .number()
    .int()
    .positive()
    .max(5 * 1024 * 1024, 'Tệp không được vượt quá 5 MB.'),
  organizationId: z.string().trim().min(1),
  projectId: z.string().trim().max(80).optional().default(''),
})

export const profileSchema = z.object({
  name: z.string().trim().min(2, 'Họ tên phải có ít nhất 2 ký tự.').max(80),
  phone: z
    .union([phone, z.literal('')])
    .optional()
    .default(''),
  title: z.string().trim().max(100).optional().default(''),
})

export const passwordChangeSchema = z
  .object({
    currentPassword: z
      .string()
      .min(8, 'Mật khẩu hiện tại chưa hợp lệ.')
      .max(128),
    newPassword: z
      .string()
      .min(12, 'Mật khẩu mới phải có ít nhất 12 ký tự.')
      .max(128)
      .regex(/[A-Z]/, 'Mật khẩu mới cần ít nhất một chữ hoa.')
      .regex(/[a-z]/, 'Mật khẩu mới cần ít nhất một chữ thường.')
      .regex(/[0-9]/, 'Mật khẩu mới cần ít nhất một chữ số.')
      .regex(/[^A-Za-z0-9]/, 'Mật khẩu mới cần ít nhất một ký tự đặc biệt.'),
    confirmPassword: z.string(),
  })
  .refine((value) => value.newPassword === value.confirmPassword, {
    path: ['confirmPassword'],
    error: 'Xác nhận mật khẩu chưa khớp.',
  })

export const blogPostSchema = z.object({
  title: z.string().trim().min(8, 'Tiêu đề phải có ít nhất 8 ký tự.').max(180),
  slug: z
    .string()
    .trim()
    .min(5, 'Slug phải có ít nhất 5 ký tự.')
    .max(180)
    .regex(
      /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
      'Slug chỉ gồm chữ thường, số và dấu gạch ngang.',
    ),
  excerpt: z
    .string()
    .trim()
    .min(20, 'Mô tả ngắn phải có ít nhất 20 ký tự.')
    .max(400),
  content: z
    .string()
    .trim()
    .min(50, 'Nội dung phải có ít nhất 50 ký tự.')
    .max(30000),
  status: z.enum(['DRAFT', 'PUBLISHED', 'ARCHIVED']),
  metaTitle: z.string().trim().max(180).optional().default(''),
  metaDescription: z.string().trim().max(300).optional().default(''),
})

export const userAdminSchema = z.object({
  role: z.enum(['ADMIN', 'STAFF', 'CUSTOMER']),
  active: z.boolean(),
})

export const serviceAdminSchema = z.object({
  name: z.string().trim().min(3).max(120),
  summary: z.string().trim().min(10).max(240),
  description: z.string().trim().min(20).max(3000),
  active: z.boolean(),
})

export const caseStudyAdminSchema = z.object({
  title: z.string().trim().min(8).max(180),
  excerpt: z.string().trim().min(20).max(400),
  challenge: z.string().trim().min(20).max(3000),
  solution: z.string().trim().min(20).max(3000),
  outcome: z.string().trim().min(10).max(2000),
  industry: z.string().trim().min(2).max(100),
  featured: z.boolean(),
  published: z.boolean(),
})

export const siteSettingSchema = z.object({
  value: z
    .string()
    .trim()
    .min(10, 'Nội dung phải có ít nhất 10 ký tự.')
    .max(600),
})

export const notificationComposeSchema = z.object({
  userId: z.string().trim().min(1, 'Vui lòng chọn người nhận.'),
  title: z.string().trim().min(5, 'Tiêu đề phải có ít nhất 5 ký tự.').max(140),
  message: z
    .string()
    .trim()
    .min(10, 'Nội dung phải có ít nhất 10 ký tự.')
    .max(1000),
  href: z
    .union([
      z
        .string()
        .trim()
        .regex(/^\/portal(?:\/|$)/, 'Liên kết phải nằm trong portal.'),
      z.literal(''),
    ])
    .optional()
    .default(''),
})

export const announcementSchema = z.object({
  title: z.string().trim().min(5, 'Tiêu đề phải có ít nhất 5 ký tự.').max(160),
  content: z
    .string()
    .trim()
    .min(20, 'Nội dung phải có ít nhất 20 ký tự.')
    .max(3000),
  audience: z.enum(['ALL', 'STAFF', 'CUSTOMER']),
})

export type LoginInput = z.infer<typeof loginSchema>
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>
export type ContactInput = z.infer<typeof contactSchema>
export type QuoteInput = z.infer<typeof quoteSchema>
export type TicketInput = z.input<typeof ticketSchema>
export type TicketOutput = z.output<typeof ticketSchema>
export type ProjectInput = z.input<typeof projectSchema>
export type ProjectOutput = z.output<typeof projectSchema>
export type TaskInput = z.input<typeof taskSchema>
export type TaskOutput = z.output<typeof taskSchema>
export type TicketMessageInput = z.input<typeof ticketMessageSchema>
export type ProfileInput = z.input<typeof profileSchema>
export type PasswordChangeInput = z.input<typeof passwordChangeSchema>
export type BlogPostInput = z.input<typeof blogPostSchema>
export type BlogPostOutput = z.output<typeof blogPostSchema>
export type ContactFormValues = z.input<typeof contactSchema>
export type QuoteFormValues = z.input<typeof quoteSchema>
