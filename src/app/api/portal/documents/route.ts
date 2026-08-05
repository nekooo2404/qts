import { NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'

import { recordAudit } from '@/lib/audit'
import { authorizeMutation } from '@/lib/auth/api'
import { db } from '@/lib/db'
import {
  messageResponse,
  readJsonBody,
  RequestBodyError,
  validationErrorResponse,
} from '@/lib/http/response'
import { projectScope } from '@/server/repositories/portal'
import { documentSchema } from '@/lib/validation/forms'

export async function POST(request: Request) {
  const auth = await authorizeMutation(request)
  if (auth.error) return auth.error
  if (auth.user.role === 'CUSTOMER')
    return messageResponse('Bạn không có quyền tải tài liệu lên.', 403)

  try {
    const result = documentSchema.safeParse(await readJsonBody(request))
    if (!result.success) return validationErrorResponse(result.error)
    const project = result.data.projectId
      ? await db.project.findFirst({
          where: {
            AND: [projectScope(auth.user), { id: result.data.projectId }],
          },
          select: { id: true, organizationId: true },
        })
      : null
    if (result.data.projectId && !project)
      return messageResponse(
        'Dự án không tồn tại hoặc nằm ngoài phạm vi của bạn.',
        404,
      )
    if (project && project.organizationId !== result.data.organizationId)
      return messageResponse('Tổ chức và dự án không khớp.', 422)

    const organization = await db.organization.findUnique({
      where: { id: result.data.organizationId },
      select: { id: true },
    })
    if (!organization) return messageResponse('Tổ chức không tồn tại.', 422)
    const document = await db.document.create({
      data: {
        name: result.data.name,
        type: result.data.type,
        fileName: result.data.fileName,
        mimeType: result.data.mimeType,
        size: result.data.size,
        url: 'demo-metadata-only',
        organizationId: result.data.organizationId,
        projectId: project?.id ?? null,
        uploadedById: auth.user.id,
      },
      select: { id: true },
    })
    await recordAudit({
      request,
      userId: auth.user.id,
      action: 'UPLOAD_DOCUMENT_METADATA',
      entity: 'Document',
      entityId: document.id,
      metadata: { demo: true, fileName: result.data.fileName },
    })
    revalidatePath('/portal/documents')
    return NextResponse.json(
      {
        ok: true,
        message:
          'Đã lưu metadata tài liệu demo. Nội dung tệp không được lưu trên máy chủ.',
        data: document,
      },
      { status: 201 },
    )
  } catch (error) {
    if (error instanceof RequestBodyError)
      return messageResponse(error.message, 400)
    console.error('Không thể lưu tài liệu demo.', error)
    return messageResponse('Không thể tải tài liệu lên lúc này.', 500)
  }
}
