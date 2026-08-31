import { IS_PLATFORM, useParams } from 'common'

import { StorageSettings } from '@/components/interfaces/Storage/StorageSettings/StorageSettings'
import { DefaultLayout } from '@/components/layouts/DefaultLayout'
import { StorageBucketsLayout } from '@/components/layouts/StorageLayout/StorageBucketsLayout'
import StorageLayout from '@/components/layouts/StorageLayout/StorageLayout'
import { UnknownInterface } from '@/components/ui/UnknownInterface'
import type { NextPageWithLayout } from '@/types'

const FilesSettingsPage: NextPageWithLayout = () => {
  const { ref } = useParams()

  // Self-hosted storage reads its settings from the container environment.
  if (!IS_PLATFORM) {
    return <UnknownInterface urlBack={`/project/${ref}/storage/files`} />
  }

  return <StorageSettings />
}

FilesSettingsPage.getLayout = (page) => (
  <DefaultLayout>
    <StorageLayout title="Settings">
      <StorageBucketsLayout>{page}</StorageBucketsLayout>
    </StorageLayout>
  </DefaultLayout>
)

export default FilesSettingsPage
