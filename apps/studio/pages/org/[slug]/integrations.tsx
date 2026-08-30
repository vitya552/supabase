import { IS_PLATFORM, useParams } from 'common'
import { PageContainer } from 'ui-patterns/PageContainer'
import {
  PageHeader,
  PageHeaderDescription,
  PageHeaderMeta,
  PageHeaderSummary,
  PageHeaderTitle,
} from 'ui-patterns/PageHeader'

import { IntegrationSettings } from '@/components/interfaces/Organization/IntegrationSettings/IntegrationSettings'
import { DefaultLayout } from '@/components/layouts/DefaultLayout'
import OrganizationLayout from '@/components/layouts/OrganizationLayout'
import { UnknownInterface } from '@/components/ui/UnknownInterface'
import type { NextPageWithLayout } from '@/types'

const OrgIntegrationSettings: NextPageWithLayout = () => {
  const { slug } = useParams()

  if (!IS_PLATFORM) {
    return <UnknownInterface urlBack={`/org/${slug}`} />
  }

  return (
    <>
      <PageHeader size="small">
        <PageHeaderMeta>
          <PageHeaderSummary>
            <PageHeaderTitle>Integrations</PageHeaderTitle>
            <PageHeaderDescription>
              Connect external services to your organization
            </PageHeaderDescription>
          </PageHeaderSummary>
        </PageHeaderMeta>
      </PageHeader>
      <PageContainer size="small">
        <IntegrationSettings />
      </PageContainer>
    </>
  )
}

OrgIntegrationSettings.getLayout = (page) => (
  <DefaultLayout>
    <OrganizationLayout title="Integrations">{page}</OrganizationLayout>
  </DefaultLayout>
)

export default OrgIntegrationSettings
