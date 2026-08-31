import { zodResolver } from '@hookform/resolvers/zod'
import { Eye, EyeOff } from 'lucide-react'
import { useRouter } from 'next/router'
import { useState } from 'react'
import { useForm, type SubmitHandler } from 'react-hook-form'
import { toast } from 'sonner'
import { Button, Form, FormControl, FormField, Input } from 'ui'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'
import z from 'zod'

const schema = z.object({
  username: z.string().min(1, 'Username is required'),
  password: z.string().min(1, 'Password is required'),
})

const mfaSchema = z.object({
  code: z.string().regex(/^\d{6}$/, 'Enter the 6-digit code'),
})

const formId = 'sign-in-self-hosted-form'

/** Only same-origin absolute paths are allowed as post-login redirects. */
function sanitizeReturnTo(path: string | undefined): string {
  if (!path || !path.startsWith('/') || path.startsWith('//')) return '/project/default'
  return path
}

/**
 * Sign in form for self-hosted deployments: validates the dashboard
 * credentials against the management API's gateway session endpoint,
 * which sets an HttpOnly session cookie checked by the gateway.
 */
export const SignInSelfHostedForm = () => {
  const router = useRouter()
  const [isPasswordHidden, setIsPasswordHidden] = useState(true)
  const [mfaToken, setMfaToken] = useState<string | null>(null)

  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: { username: '', password: '' },
  })
  const isSubmitting = form.formState.isSubmitting

  const onSubmit: SubmitHandler<z.infer<typeof schema>> = async ({ username, password }) => {
    const toastId = toast.loading('Signing in...')
    const response = await fetch('/dashboard-auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'same-origin',
      body: JSON.stringify({ username, password }),
    }).catch(() => null)

    if (!response || !response.ok) {
      toast.error(
        response?.status === 401
          ? 'Invalid username or password'
          : 'Failed to sign in: could not reach the server',
        { id: toastId }
      )
      return
    }

    const body = await response.json().catch(() => null)
    if (body?.mfa_required && typeof body?.mfa_token === 'string') {
      toast.dismiss(toastId)
      setMfaToken(body.mfa_token)
      return
    }

    toast.success('Signed in successfully!', { id: toastId })
    const returnTo = typeof router.query.returnTo === 'string' ? router.query.returnTo : undefined
    // Full navigation so the gateway re-evaluates the new session cookie.
    window.location.assign(sanitizeReturnTo(returnTo))
  }

  const mfaForm = useForm<z.infer<typeof mfaSchema>>({
    resolver: zodResolver(mfaSchema),
    defaultValues: { code: '' },
  })
  const isVerifying = mfaForm.formState.isSubmitting

  const onSubmitMfa: SubmitHandler<z.infer<typeof mfaSchema>> = async ({ code }) => {
    const toastId = toast.loading('Verifying code...')
    const response = await fetch('/dashboard-auth/mfa-verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'same-origin',
      body: JSON.stringify({ mfa_token: mfaToken, code }),
    }).catch(() => null)

    if (!response || !response.ok) {
      if (response?.status === 401) {
        const body = await response.json().catch(() => null)
        if (body?.message === 'sign in again to continue') {
          toast.error('Session expired, sign in again', { id: toastId })
          setMfaToken(null)
          mfaForm.reset()
          return
        }
        toast.error('Invalid verification code', { id: toastId })
        return
      }
      toast.error('Failed to verify code: could not reach the server', { id: toastId })
      return
    }

    toast.success('Signed in successfully!', { id: toastId })
    const returnTo = typeof router.query.returnTo === 'string' ? router.query.returnTo : undefined
    window.location.assign(sanitizeReturnTo(returnTo))
  }

  if (mfaToken !== null) {
    return (
      <Form {...mfaForm}>
        <form
          id="sign-in-self-hosted-mfa-form"
          method="POST"
          className="flex flex-col gap-4"
          onSubmit={mfaForm.handleSubmit(onSubmitMfa)}
        >
          <FormField
            key="code"
            name="code"
            control={mfaForm.control}
            render={({ field }) => (
              <FormItemLayout
                name="code"
                label="Verification code"
                description="Enter the 6-digit code from your authenticator app"
              >
                <FormControl>
                  <Input
                    id="code"
                    autoComplete="one-time-code"
                    autoFocus
                    {...field}
                    placeholder="123456"
                    disabled={isVerifying}
                  />
                </FormControl>
              </FormItemLayout>
            )}
          />
          <Button
            block
            form="sign-in-self-hosted-mfa-form"
            type="submit"
            size="large"
            loading={isVerifying}
          >
            Verify
          </Button>
        </form>
      </Form>
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
                  placeholder="Dashboard username"
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
                    autoComplete="current-password"
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
          Sign in
        </Button>
      </form>
    </Form>
  )
}
