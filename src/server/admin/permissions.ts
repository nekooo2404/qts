import 'server-only'

import { z } from 'zod'
import { NextResponse } from 'next/server'

import { recordAudit } from '@/lib/audit'
import { authorizePermission, type ApiAuthResult } from '@/lib/auth/api'
import {
  resolvePermissionKeys,
  resolveRoleDefaultKeys,
  type PermissionEffect,
} from '@/lib/auth/permission-resolver'
import { db } from '@/lib/db'
import {
  hasPermission,
  PERMISSION_CATALOG,
  ROLE_DEFAULT_PERMISSION_KEYS,
  type PermissionKey,
  type RoleName,
} from '@/lib/domain/permissions'
import {
  messageResponse,
  readJsonBody,
  RequestBodyError,
  validationErrorResponse,
} from '@/lib/http/response'
import {
  hasActivePermissionManager,
  LastPermissionManagerError,
} from '@/server/admin/permission-invariants'

const overrideItemSchema = z.object({
  key: z.string().trim().min(1).max(120),
  effect: z.enum(['ALLOW', 'DENY']),
})

const overridePayloadSchema = z.object({
  overrides: z.array(overrideItemSchema).max(PERMISSION_CATALOG.length),
})

export type PermissionRouteContext = {
  params: Promise<{ id: string }>
}

class TargetUserNotFoundError extends Error {}

function catalogItem(key: string) {
  return PERMISSION_CATALOG.find((item) => item.key === key)
}

function authError(auth: ApiAuthResult): NextResponse {
  return (
    auth.error ??
    NextResponse.json(
      { ok: false, message: 'Yêu cầu không được phép.' },
      { status: 403 },
    )
  )
}

async function authorizePermissionRead(request: Request) {
  const auth = await authorizePermission(request, 'admin.access', {
    mutation: false,
  })
  if (auth.error || !auth.user) return auth
  if (!hasPermission(auth.user, 'admin.permissions.read')) {
    return {
      user: null,
      error: NextResponse.json(
        { ok: false, message: 'Không có quyền xem cấu hình phân quyền.' },
        { status: 403 },
      ),
    } satisfies ApiAuthResult
  }
  return auth
}

async function authorizePermissionManage(request: Request) {
  const auth = await authorizePermission(request, 'admin.access')
  if (auth.error || !auth.user) return auth
  if (
    !hasPermission(auth.user, 'admin.permissions.read') ||
    !hasPermission(auth.user, 'admin.permissions.manage')
  ) {
    return {
      user: null,
      error: NextResponse.json(
        { ok: false, message: 'Không có quyền quản lý phân quyền.' },
        { status: 403 },
      ),
    } satisfies ApiAuthResult
  }
  return auth
}

async function ensurePermissionCatalog() {
  await db.$transaction(
    PERMISSION_CATALOG.map((permission) =>
      db.permission.upsert({
        where: { key: permission.key },
        create: {
          key: permission.key,
          label: permission.label,
          description: permission.description,
          module: permission.module,
          action: permission.action,
        },
        update: {
          label: permission.label,
          description: permission.description,
          module: permission.module,
          action: permission.action,
        },
      }),
    ),
  )

  // Backfill defaults added after an existing database was seeded without
  // overwriting any explicit role-level DENY policy.
  const [roles, permissions, existing] = await Promise.all([
    db.role.findMany({ select: { id: true, name: true } }),
    db.permission.findMany({ select: { id: true, key: true } }),
    db.rolePermission.findMany({
      select: { roleId: true, permissionId: true },
    }),
  ])
  const roleIds = new Map(roles.map((role) => [role.name, role.id]))
  const permissionIds = new Map(
    permissions.map((permission) => [permission.key, permission.id]),
  )
  const existingPairs = new Set(
    existing.map((item) => `${item.roleId}:${item.permissionId}`),
  )
  const missingDefaults = (
    Object.entries(ROLE_DEFAULT_PERMISSION_KEYS) as Array<
      [RoleName, readonly PermissionKey[]]
    >
  ).flatMap(([roleName, keys]) => {
    const roleId = roleIds.get(roleName)
    if (!roleId) return []
    return keys.flatMap((key) => {
      const permissionId = permissionIds.get(key)
      if (!permissionId || existingPairs.has(`${roleId}:${permissionId}`))
        return []
      return [{ roleId, permissionId, effect: 'ALLOW' as const }]
    })
  })
  if (missingDefaults.length) {
    await db.$transaction(
      missingDefaults.map((data) =>
        db.rolePermission.upsert({
          where: {
            roleId_permissionId: {
              roleId: data.roleId,
              permissionId: data.permissionId,
            },
          },
          create: data,
          update: {},
        }),
      ),
    )
  }
}

export async function getPermissionCatalog(request: Request) {
  const auth = await authorizePermissionRead(request)
  if (auth.error) return authError(auth)
  await ensurePermissionCatalog()

  const roleDefaults = Object.fromEntries(
    (
      Object.entries(ROLE_DEFAULT_PERMISSION_KEYS) as Array<
        [RoleName, readonly PermissionKey[]]
      >
    ).map(([role, keys]) => [role, keys]),
  )

  return Response.json({
    ok: true,
    data: {
      catalog: PERMISSION_CATALOG,
      roleDefaults,
    },
  })
}

async function getTargetPermissionState(id: string) {
  const target = await db.user.findUnique({
    where: { id },
    select: {
      id: true,
      email: true,
      name: true,
      active: true,
      role: {
        select: {
          name: true,
          permissions: {
            select: { effect: true, permission: { select: { key: true } } },
          },
        },
      },
      permissionOverrides: {
        select: { effect: true, permission: { select: { key: true } } },
      },
    },
  })

  if (!target) return null

  const roleDefaults = target.role.permissions.map((item) => ({
    key: item.permission.key,
    effect: item.effect as PermissionEffect,
  }))
  const overrides = target.permissionOverrides.map((item) => ({
    key: item.permission.key,
    effect: item.effect as PermissionEffect,
  }))
  const effectiveKeys = resolvePermissionKeys(
    target.role.name,
    roleDefaults,
    overrides,
  )
  const overrideMap = new Map(overrides.map((item) => [item.key, item.effect]))
  const roleDefaultSet = new Set(
    resolveRoleDefaultKeys(target.role.name, roleDefaults),
  )

  return {
    user: {
      id: target.id,
      email: target.email,
      name: target.name,
      active: target.active,
      role: target.role.name,
    },
    effectiveKeys,
    overrides,
    permissions: PERMISSION_CATALOG.map((item) => ({
      ...item,
      roleDefault: roleDefaultSet.has(item.key),
      override: overrideMap.get(item.key) ?? null,
      effective: effectiveKeys.includes(item.key),
    })),
  }
}

export async function getUserPermissions(
  request: Request,
  context: PermissionRouteContext,
) {
  const auth = await authorizePermissionRead(request)
  if (auth.error) return authError(auth)
  await ensurePermissionCatalog()
  const { id } = await context.params
  const state = await getTargetPermissionState(id)
  if (!state) return messageResponse('Không tìm thấy người dùng.', 404)
  return Response.json({ ok: true, data: state })
}

function parseOverrides(body: unknown) {
  const result = overridePayloadSchema.safeParse(body)
  if (!result.success) return result

  const seen = new Set<string>()
  const unknown = result.data.overrides.find((item) => {
    if (!catalogItem(item.key) || seen.has(item.key)) return true
    seen.add(item.key)
    return false
  })
  if (unknown) {
    return {
      success: false as const,
      error: new z.ZodError([
        {
          code: 'custom',
          path: ['overrides'],
          message: 'Permission key không tồn tại hoặc bị lặp.',
        },
      ]),
    }
  }
  return result
}

export async function updateUserPermissions(
  request: Request,
  context: PermissionRouteContext,
) {
  const auth = await authorizePermissionManage(request)
  if (auth.error) return authError(auth)
  await ensurePermissionCatalog()
  const { id } = await context.params

  try {
    const body = await readJsonBody(request)
    const result = parseOverrides(body)
    if (!result.success) return validationErrorResponse(result.error)

    const permissionRows = await db.permission.findMany({
      where: { key: { in: result.data.overrides.map((item) => item.key) } },
      select: { id: true, key: true },
    })
    const permissionIds = new Map(
      permissionRows.map((item) => [item.key, item.id]),
    )

    await db.$transaction(
      async (tx) => {
        const target = await tx.user.findUnique({
          where: { id },
          select: { id: true },
        })
        if (!target) throw new TargetUserNotFoundError()

        if (
          !(await hasActivePermissionManager(tx, {
            userId: id,
            overrides: result.data.overrides,
          }))
        ) {
          throw new LastPermissionManagerError()
        }

        await tx.userPermission.deleteMany({ where: { userId: id } })
        if (result.data.overrides.length) {
          await tx.userPermission.createMany({
            data: result.data.overrides.map((item) => ({
              userId: id,
              permissionId: permissionIds.get(item.key)!,
              effect: item.effect,
            })),
          })
        }
      },
      { isolationLevel: 'Serializable' },
    )

    await recordAudit({
      request,
      userId: auth.user.id,
      action: 'UPDATE_USER_PERMISSIONS',
      entity: 'UserPermission',
      entityId: id,
      metadata: { overrideCount: result.data.overrides.length },
    })

    return getUserPermissions(request, context)
  } catch (error) {
    if (error instanceof RequestBodyError)
      return messageResponse(error.message, 400)
    if (error instanceof TargetUserNotFoundError)
      return messageResponse('Không tìm thấy người dùng.', 404)
    if (error instanceof LastPermissionManagerError)
      return messageResponse(
        'Hệ thống phải còn ít nhất một người có quyền quản lý phân quyền.',
        409,
      )
    console.error('Không thể cập nhật phân quyền người dùng.', error)
    return messageResponse('Không thể cập nhật phân quyền lúc này.', 500)
  }
}
