import { zodResolver } from '@hookform/resolvers/zod'
import { Eye, EyeOff } from 'lucide-react'
import { useRouter } from 'next/router'
import { useState } from 'react'
import { useForm, type SubmitHandler } from 'react-hook-form'
import { toast } from 'sonner'
import { Button, Form, FormControl, FormField, Input } from 'ui'
import { Admonition } from 'ui-patterns/Admonition'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'
import z from 'zod'

const schema = z.object({
  username: z
    .string()
    .min(3, 'Username must be at least 3 characters')
    .max(64, 'Username must be at most 64 characters')
    .regex(/^[A-Za-z0-9_.@-]+$/, 'Only letters, digits and _ . @ - are allowed'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
})

const formId = 'join-self-hosted-form'

/**
 * Invitation acceptance form for self-hosted deployments: exchanges the
 * one-time invitation token for a new dashboard account and a session cookie
 * via the management API's gateway auth endpoint.
 */
export const JoinSelfHostedForm = () => {
  const router = useRouter()
  const [isPasswordHidden, setIsPasswordHidden] = useState(true)
  const token = typeof router.query.token === 'string' ? router.query.token : ''

  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: { username: '', password: '' },
  })
  const isSubmitting = form.formState.isSubmitting

  const onSubmit: SubmitHandler<z.infer<typeof schema>> = async ({ username, password }) => {
    const toastId = toast.loading('Creating your account...')
    const response = await fetch('/dashboard-auth/accept-invitation', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'same-origin',
      body: JSON.stringify({ token, username, password }),
    }).catch(() => null)

    if (!response || !response.ok) {
      const body: unknown = response ? await response.json().catch(() => null) : null
      const message =
        typeof body === 'object' && body !== null && 'message' in body &&
        typeof body.message === 'string'
          ? body.message
          : 'Failed to create the account: could not reach the server'
      toast.error(message, { id: toastId })
      return
    }

    toast.success('Account created, signing you in...', { id: toastId })
    const body: unknown = await response.json().catch(() => null)
    const organizationSlug =
      typeof body === 'object' &&
      body !== null &&
      'organization_slug' in body &&
      typeof body.organization_slug === 'string'
        ? body.organization_slug
        : null
    // Full navigation so the gateway re-evaluates the new session cookie.
    window.location.assign(organizationSlug ? `/org/${organizationSlug}` : '/organizations')
  }

  if (!token) {
    return (
      <Admonition
        type="warning"
        title="Invalid invitation link"
        description="This link is missing its invitation token. Ask the person who invited you for a new link."
      />
    )
  }

  return (
    <Form {...form}>
      <form
        id={formId}
        method="POST"
        className="flex flex-col gap-4"
        onSubmit={form.handleSubmit(onSubmit)}
      >
        <FormField
          key="username"
          name="username"
          control={form.control}
          render={({ field }) => (
            <FormItemLayout name="username" label="Username">
              <FormControl>
                <Input
                  id="username"
                  autoComplete="username"
                  {...field}
                  placeholder="Choose a dashboard username"
                  disabled={isSubmitting}
                />
              </FormControl>
            </FormItemLayout>
          )}
        />

        <FormField
          key="password"
          name="password"
          control={form.control}
          render={({ field }) => (
            <FormItemLayout name="password" label="Password">
              <FormControl>
                <div className="relative">
                  <Input
                    id="password"
                    type={isPasswordHidden ? 'password' : 'text'}
                    autoComplete="new-password"
                    {...field}
                    placeholder="&bull;&bull;&bull;&bull;&bull;&bull;&bull;&bull;"
                    disabled={isSubmitting}
                    className="pr-10"
                  />
                  <Button
                    variant="default"
                    title={isPasswordHidden ? `Show password` : `Hide password`}
                    aria-label={isPasswordHidden ? `Show password` : `Hide password`}
                    className="absolute right-1 top-1 px-1.5"
                    icon={isPasswordHidden ? <Eye /> : <EyeOff />}
                    disabled={isSubmitting}
                    onClick={() => setIsPasswordHidden((prev) => !prev)}
                  />
                </div>
              </FormControl>
            </FormItemLayout>
          )}
        />

        <Button block form={formId} type="submit" size="large" loading={isSubmitting}>
          Accept invitation
        </Button>
      </form>
    </Form>
  )
}
