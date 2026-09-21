import { PermissionAction } from '@supabase/shared-types/out/constants'

import {
  useOrganizationMembersQuery,
  type OrganizationMember,
} from '@/data/organizations/organization-members-query'
import { doPermissionsCheck } from '@/hooks/misc/useCheckPermissions'
import { IS_PLATFORM } from '@/lib/constants'
import { useProfile } from '@/lib/profile'
import type { Permission, Role } from '@/types'

export const useGetRolesManagementPermissions = (
  orgSlug?: string,
  roles?: Role[],
  permissions?: Permission[]
): { rolesAddable: Number[]; rolesRemovable: Number[] } => {
  const { profile } = useProfile()
  const { data: members } = useOrganizationMembersQuery(
    { slug: orgSlug },
    { enabled: !IS_PLATFORM }
  )

  const rolesAddable: Number[] = []
  const rolesRemovable: Number[] = []
  if (!roles || !orgSlug) return { rolesAddable, rolesRemovable }

  // Self-hosted has no platform permissions API: mirror the management API's
  // server-side rules - owners manage every role, admins manage every role
  // except Owner, developers manage none.
  if (!IS_PLATFORM) {
    const currentUserMember = members?.find((member) => member.gotrue_id === profile?.gotrue_id)
    const currentUserRole = roles.find((role) => role.id === currentUserMember?.role_ids?.[0])
    if (currentUserRole?.name === 'Owner') {
      const ids = roles.map((role) => role.id)
      return { rolesAddable: ids, rolesRemovable: ids }
    }
    if (currentUserRole?.name === 'Administrator') {
      const ids = roles.filter((role) => role.name !== 'Owner').map((role) => role.id)
      return { rolesAddable: ids, rolesRemovable: ids }
    }
    return { rolesAddable, rolesRemovable }
  }

  roles.forEach((role: Role) => {
    const canAdd = doPermissionsCheck(
      permissions,
      PermissionAction.CREATE,
      'auth.subject_roles',
      {
        resource: { role_id: role.id },
      },
      orgSlug
    )
    if (canAdd) rolesAddable.push(role.id)

    const canRemove = doPermissionsCheck(
      permissions,
      PermissionAction.DELETE,
      'auth.subject_roles',
      {
        resource: { role_id: role.id },
      },
      orgSlug
    )
    if (canRemove) rolesRemovable.push(role.id)
  })

  return { rolesAddable, rolesRemovable }
}

export const hasMultipleOwners = (members: OrganizationMember[] = [], roles: Role[] = []) => {
  const membersWhoAreOwners = members.filter((member) => {
    const [memberRoleId] = member.role_ids ?? []
    const role = roles.find((role: Role) => role.id === memberRoleId)
    return role?.name === 'Owner' && !member.invited_at
  })
  return membersWhoAreOwners.length > 1
}
