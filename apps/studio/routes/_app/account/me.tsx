import { createFileRoute } from '@tanstack/react-router'

import User from '@/pages/account/me'

export const Route = createFileRoute('/_app/account/me')({
  component: AccountMePage,
  staticData: {
    defaultLayoutHeaderTitle: 'Account',
    accountLayoutTitle: 'Preferences',
  },
})

function AccountMePage() {
  return <User dehydratedState={undefined} />
}
