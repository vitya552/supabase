import Head from 'next/head'

import { OrganizationInvite } from '@/components/interfaces/OrganizationInvite/OrganizationInvite'
import { JoinSelfHostedForm } from '@/components/interfaces/SignIn/JoinSelfHostedForm'
import { IS_PLATFORM } from '@/lib/constants'
import { buildStudioPageTitle } from '@/lib/page-title'
import type { NextPageWithLayout } from '@/types'

const PAGE_TITLE = buildStudioPageTitle({ section: 'Join Organization', brand: 'Supabase' })

const JoinOrganizationPage: NextPageWithLayout = () => {
  return (
    <>
      <Head>
        <title>{PAGE_TITLE}</title>
      </Head>
      {IS_PLATFORM ? (
        <OrganizationInvite />
      ) : (
        <div className="flex min-h-screen items-center justify-center">
          <div className="w-full max-w-sm px-5">
            <h4 className="text-lg mb-4">Join this Supabase dashboard</h4>
            <JoinSelfHostedForm />
          </div>
        </div>
      )}
    </>
  )
}

export default JoinOrganizationPage
