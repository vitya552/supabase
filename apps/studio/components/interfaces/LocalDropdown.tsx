import { FlaskConical, Settings } from 'lucide-react'
import { useTheme } from 'next-themes'
import Link from 'next/link'
import { useRouter } from 'next/router'
import {
  cn,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  singleThemes,
} from 'ui'

import { ButtonTooltip } from '../ui/ButtonTooltip'
import { useFeaturePreviewModal } from './App/FeaturePreview/FeaturePreviewContext'
import { DevToolbarMenuGroup } from './DevToolbarMenuGroup'
import { ProfileImage } from '@/components/ui/ProfileImage'
import { useIsManagementApiEnabled } from '@/data/config/deployment-mode-query'
import { useProfile } from '@/lib/profile'
import { useTrack } from '@/lib/telemetry/track'
import { useAppStateSnapshot } from '@/state/app-state'

export const LocalDropdown = ({
  triggerClassName,
  contentClassName,
}: {
  triggerClassName?: string
  contentClassName?: string
}) => {
  const router = useRouter()
  const { theme, setTheme } = useTheme()
  const appStateSnapshot = useAppStateSnapshot()
  const { toggleFeaturePreviewModal } = useFeaturePreviewModal()
  const track = useTrack()
  const isManagementApiEnabled = useIsManagementApiEnabled()
  const { profile } = useProfile()
  const username = isManagementApiEnabled ? profile?.username : undefined

  const handleSignOut = async () => {
    await fetch('/dashboard-auth/logout', { method: 'POST', credentials: 'same-origin' }).catch(
      () => null
    )
    // Full navigation so the gateway re-evaluates the cleared session cookie.
    window.location.assign('/sign-in')
  }

  return (
    <DropdownMenu
      onOpenChange={(open) => {
        if (open) track('header_local_dropdown_opened')
      }}
    >
      <DropdownMenuTrigger className={cn('border shrink-0 px-3', triggerClassName)} asChild>
        <ButtonTooltip
          variant="default"
          className="[&>span]:flex px-0 py-0 rounded-full overflow-hidden h-8 w-8"
          tooltip={{ content: { text: 'Settings' } }}
        >
          <ProfileImage className="w-8 h-8 rounded-md" />
          <span className="sr-only">Settings</span>
        </ButtonTooltip>
      </DropdownMenuTrigger>
      <DropdownMenuContent side="bottom" align="end" className={cn('w-44', contentClassName)}>
        {!!username && (
          <>
            <div className="px-2 py-1 flex flex-col gap-0 text-sm">
              <span title={username} className="w-full text-left text-foreground truncate">
                {username}
              </span>
            </div>
            <DropdownMenuSeparator />
          </>
        )}
        <DropdownMenuItem className="flex gap-2 cursor-pointer" asChild>
          <Link
            href="/account/me"
            onClick={() => {
              if (router.pathname !== '/account/me') {
                appStateSnapshot.setLastRouteBeforeVisitingAccountPage(router.asPath)
              }
            }}
          >
            <Settings size={14} strokeWidth={1.5} className="text-foreground-lighter" />
            Preferences
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem
          className="flex gap-2 cursor-pointer"
          onClick={() => toggleFeaturePreviewModal(true)}
          onSelect={() => toggleFeaturePreviewModal(true)}
        >
          <FlaskConical size={14} strokeWidth={1.5} className="text-foreground-lighter" />
          Feature previews
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DevToolbarMenuGroup />
        <DropdownMenuGroup>
          <DropdownMenuLabel>Theme</DropdownMenuLabel>
          <DropdownMenuRadioGroup
            value={theme}
            onValueChange={(value) => {
              setTheme(value)
            }}
          >
            {singleThemes.map((theme) => (
              <DropdownMenuRadioItem
                key={theme.value}
                value={theme.value}
                className="cursor-pointer"
              >
                {theme.name}
              </DropdownMenuRadioItem>
            ))}
          </DropdownMenuRadioGroup>
        </DropdownMenuGroup>
        {isManagementApiEnabled && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem className="cursor-pointer" onSelect={handleSignOut}>
                Log out
              </DropdownMenuItem>
            </DropdownMenuGroup>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
