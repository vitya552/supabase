import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { SubmitHandler, useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { Form, FormControl, FormField, Input } from 'ui'
import { Input as PasswordInput } from 'ui-patterns/DataInputs/Input'
import ConfirmationModal from 'ui-patterns/Dialogs/ConfirmationModal'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'
import * as z from 'zod'

import {
  useDashboardFactorCreateMutation,
  type DashboardFactorCreateResponse,
} from '@/data/profile/dashboard-factor-create-mutation'
import { useDashboardFactorDeleteMutation } from '@/data/profile/dashboard-factor-delete-mutation'
import { useDashboardFactorVerifyMutation } from '@/data/profile/dashboard-factor-verify-mutation'

const NameSchema = z.object({ friendlyName: z.string().trim().min(1, 'Please provide a name') })
const CodeSchema = z.object({ code: z.string().regex(/^\d{6}$/, 'Enter the 6-digit code') })

interface AddDashboardFactorModalProps {
  visible: boolean
  onClose: () => void
}

/**
 * Two-step enrollment of a TOTP factor for the dashboard account: name the
 * factor, then confirm a code from the authenticator app. The secret is only
 * shown once, during this flow.
 */
export const AddDashboardFactorModal = ({ visible, onClose }: AddDashboardFactorModalProps) => {
  const [pendingFactor, setPendingFactor] = useState<DashboardFactorCreateResponse | null>(null)

  const nameForm = useForm<z.infer<typeof NameSchema>>({
    resolver: zodResolver(NameSchema),
    defaultValues: { friendlyName: '' },
  })
  const codeForm = useForm<z.infer<typeof CodeSchema>>({
    resolver: zodResolver(CodeSchema),
    defaultValues: { code: '' },
  })

  const { mutate: createFactor, isPending: isCreating } = useDashboardFactorCreateMutation({
    onSuccess: (factor) => setPendingFactor(factor),
  })
  const { mutate: verifyFactor, isPending: isVerifying } = useDashboardFactorVerifyMutation({
    onSuccess: () => {
      toast.success('Authenticator app added successfully')
      handleClose()
    },
  })
  const { mutate: deleteFactor } = useDashboardFactorDeleteMutation()

  const handleClose = () => {
    nameForm.reset()
    codeForm.reset()
    setPendingFactor(null)
    onClose()
  }

  const onSubmitName: SubmitHandler<z.infer<typeof NameSchema>> = ({ friendlyName }) => {
    createFactor({ friendlyName })
  }

  const onSubmitCode: SubmitHandler<z.infer<typeof CodeSchema>> = ({ code }) => {
    if (pendingFactor === null) return
    verifyFactor({ factorId: pendingFactor.id, code })
  }

  return (
    <>
      <ConfirmationModal
        size="medium"
        visible={visible && pendingFactor === null}
        title="Add a new authenticator app"
        confirmLabel="Generate secret"
        confirmLabelLoading="Generating secret"
        loading={isCreating}
        onCancel={handleClose}
        onConfirm={nameForm.handleSubmit(onSubmitName)}
      >
        <Form {...nameForm}>
          <form className="flex flex-col gap-4" onSubmit={nameForm.handleSubmit(onSubmitName)}>
            <FormField
              key="friendlyName"
              name="friendlyName"
              control={nameForm.control}
              render={({ field }) => (
                <FormItemLayout
                  name="friendlyName"
                  label="Authenticator app name"
                  description="Used to identify the app in your account settings."
                >
                  <FormControl>
                    <Input placeholder="e.g.: Google Authenticator" autoFocus {...field} />
                  </FormControl>
                </FormItemLayout>
              )}
            />
          </form>
        </Form>
      </ConfirmationModal>

      <ConfirmationModal
        size="medium"
        visible={visible && pendingFactor !== null}
        title="Verify the new authenticator app"
        confirmLabel="Confirm"
        confirmLabelLoading="Confirming"
        loading={isVerifying}
        onCancel={() => {
          // An unverified factor is useless, so discard it on cancel.
          if (pendingFactor !== null) deleteFactor({ factorId: pendingFactor.id })
          handleClose()
        }}
        onConfirm={codeForm.handleSubmit(onSubmitCode)}
      >
        <div className="flex flex-col gap-4">
          <p className="text-sm">
            Add this secret to your authenticator app (Google Authenticator, 1Password, ...), then
            provide the 6-digit code it shows to complete the enrollment.
          </p>
          <FormItemLayout isReactForm={false} label="Secret key for your authenticator app">
            <PasswordInput
              copy
              disabled
              id="totp-secret"
              size="small"
              value={pendingFactor?.totp.secret ?? ''}
            />
          </FormItemLayout>
          <Form {...codeForm}>
            <form className="flex flex-col gap-4" onSubmit={codeForm.handleSubmit(onSubmitCode)}>
              <FormField
                key="code"
                name="code"
                control={codeForm.control}
                render={({ field }) => (
                  <FormItemLayout name="code" label="Verification code">
                    <FormControl>
                      <Input placeholder="123456" autoComplete="one-time-code" {...field} />
                    </FormControl>
                  </FormItemLayout>
                )}
              />
            </form>
          </Form>
        </div>
      </ConfirmationModal>
    </>
  )
}
