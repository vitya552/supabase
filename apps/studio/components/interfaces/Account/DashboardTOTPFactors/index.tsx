import dayjs from 'dayjs'
import { Plus } from 'lucide-react'
import { useState } from 'react'
import { Button, Card, CardContent } from 'ui'
import {
  PageSection,
  PageSectionAside,
  PageSectionContent,
  PageSectionDescription,
  PageSectionMeta,
  PageSectionSummary,
  PageSectionTitle,
} from 'ui-patterns/PageSection'
import ConfirmationModal from 'ui-patterns/Dialogs/ConfirmationModal'
import { GenericSkeletonLoader } from 'ui-patterns/ShimmeringLoader'

import { AddDashboardFactorModal } from './AddDashboardFactorModal'
import { AlertError } from '@/components/ui/AlertError'
import { useDashboardFactorDeleteMutation } from '@/data/profile/dashboard-factor-delete-mutation'
import { useDashboardFactorsQuery } from '@/data/profile/dashboard-factors-query'
import { DATETIME_FORMAT } from '@/lib/constants'

/**
 * Self-hosted counterpart of TOTPFactors: manages the TOTP factors of the
 * signed-in dashboard user via the management API.
 */
export const DashboardTOTPFactors = () => {
  const [isAddFactorOpen, setIsAddFactorOpen] = useState(false)
  const [factorToBeDeleted, setFactorToBeDeleted] = useState<number | null>(null)

  const { data, isPending: isLoading, isError, isSuccess, error } = useDashboardFactorsQuery()
  const factors = data ?? []

  const { mutate: deleteFactor, isPending: isDeleting } = useDashboardFactorDeleteMutation({
    onSuccess: () => setFactorToBeDeleted(null),
  })

  return (
    <>
      <PageSection>
        <PageSectionMeta>
          <PageSectionSummary>
            <PageSectionTitle>Multi-factor authentication</PageSectionTitle>
            <PageSectionDescription>
              Use an authenticator app (like Google Authenticator or 1Password) to protect your
              dashboard account. Signing in will require a code once a verified app is added.
            </PageSectionDescription>
          </PageSectionSummary>
          <PageSectionAside>
            <Button variant="primary" icon={<Plus />} onClick={() => setIsAddFactorOpen(true)}>
              Add app
            </Button>
          </PageSectionAside>
        </PageSectionMeta>
        <PageSectionContent className="flex flex-col gap-4">
          {isLoading && (
            <Card>
              <CardContent>
                <GenericSkeletonLoader />
              </CardContent>
            </Card>
          )}
          {isError && (
            <AlertError error={error} subject="Failed to retrieve account security information" />
          )}
          {isSuccess && (
            <Card>
              {factors.length === 0 ? (
                <CardContent>
                  <p className="text-sm text-foreground-lighter">No authenticator apps yet.</p>
                </CardContent>
              ) : (
                <div className="divide-y">
                  {factors.map((factor) => (
                    <CardContent key={factor.id} className="flex justify-between items-center py-4">
                      <div>
                        <p className="text-sm">
                          {factor.friendly_name.length > 0
                            ? factor.friendly_name
                            : 'No name provided'}
                          {factor.status === 'unverified' && (
                            <span className="text-foreground-lighter"> (unverified)</span>
                          )}
                        </p>
                        <p className="text-sm text-foreground-lighter">
                          Added on {dayjs(factor.inserted_at).format(DATETIME_FORMAT)}
                        </p>
                      </div>
                      <Button
                        size="tiny"
                        variant="default"
                        onClick={() => setFactorToBeDeleted(factor.id)}
                      >
                        Delete
                      </Button>
                    </CardContent>
                  ))}
                </div>
              )}
            </Card>
          )}
        </PageSectionContent>
      </PageSection>
      <AddDashboardFactorModal visible={isAddFactorOpen} onClose={() => setIsAddFactorOpen(false)} />
      <ConfirmationModal
        visible={factorToBeDeleted !== null}
        title="Remove authenticator app"
        confirmLabel="Remove app"
        variant="destructive"
        loading={isDeleting}
        onCancel={() => setFactorToBeDeleted(null)}
        onConfirm={() => {
          if (factorToBeDeleted !== null) deleteFactor({ factorId: factorToBeDeleted })
        }}
      >
        <p className="text-sm text-foreground-light">
          Signing in will no longer require a code from this app. You can add it again later.
        </p>
      </ConfirmationModal>
    </>
  )
}
