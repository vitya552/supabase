import { IS_PLATFORM, useParams } from 'common'

import { Usage } from '@/components/interfaces/Organization/Usage/Usage'
import { DefaultLayout } from '@/components/layouts/DefaultLayout'
import OrganizationLayout from '@/components/layouts/OrganizationLayout'
import { UnknownInterface } from '@/components/ui/UnknownInterface'
import type { NextPageWithLayout } from '@/types'

const OrgUsage: NextPageWithLayout = () => {
  const { slug } = useParams()

  if (!IS_PLATFORM) {
    return <UnknownInterface urlBack={`/org/${slug}`} />
  }

  return <Usage />
}

OrgUsage.getLayout = (page) => (
  <DefaultLayout>
    <OrganizationLayout title="Usage">{page}</OrganizationLayout>
  </DefaultLayout>
)

export default OrgUsage
