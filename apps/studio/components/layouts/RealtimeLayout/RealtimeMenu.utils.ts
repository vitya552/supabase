import type { ProductMenuGroup } from '@/components/ui/ProductMenu/ProductMenu.types'
import type { Project } from '@/data/projects/project-detail-query'
import { useIsManagementApiEnabled } from '@/data/config/deployment-mode-query'
import { IS_PLATFORM } from '@/lib/constants'
import { SHORTCUT_IDS } from '@/state/shortcuts/registry'

/** Realtime settings are editable on the platform and on self-hosted deployments with the management API. */
export const useShowRealtimeSettings = () => {
  const isManagementApiEnabled = useIsManagementApiEnabled()
  return IS_PLATFORM || isManagementApiEnabled
}

export const generateRealtimeMenu = (
  project: Project | undefined,
  { showRealtimeSettings = IS_PLATFORM }: { showRealtimeSettings?: boolean } = {}
): ProductMenuGroup[] => {
  const ref = project?.ref ?? 'default'

  return [
    {
      title: 'Tools',
      items: [
        {
          name: 'Inspector',
          key: 'inspector',
          url: `/project/${ref}/realtime/inspector`,
          items: [],
          shortcutId: SHORTCUT_IDS.NAV_REALTIME_INSPECTOR,
        },
      ],
    },
    {
      title: 'Configuration',
      items: [
        {
          name: 'Policies',
          key: 'policies',
          url: `/project/${ref}/realtime/policies`,
          items: [],
          shortcutId: SHORTCUT_IDS.NAV_REALTIME_POLICIES,
        },
        ...(showRealtimeSettings
          ? [
              {
                name: 'Settings',
                key: 'settings',
                url: `/project/${ref}/realtime/settings`,
                items: [],
                shortcutId: SHORTCUT_IDS.NAV_REALTIME_SETTINGS,
              },
            ]
          : []),
      ],
    },
  ]
}
