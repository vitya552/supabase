import { zodResolver } from '@hookform/resolvers/zod'
import { SubmitHandler, useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { Button, Card, CardContent, CardFooter, Form, FormControl, FormField, Input } from 'ui'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'
import {
  PageSection,
  PageSectionContent,
  PageSectionDescription,
  PageSectionMeta,
  PageSectionSummary,
  PageSectionTitle,
} from 'ui-patterns/PageSection'
import * as z from 'zod'

import { useProfilePasswordUpdateMutation } from '@/data/profile/profile-password-update-mutation'

const FormSchema = z
  .object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string(),
  })
  .refine((values) => values.newPassword === values.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  })

export const AccountPassword = () => {
  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: { currentPassword: '', newPassword: '', confirmPassword: '' },
  })

  const { mutate: updatePassword, isPending } = useProfilePasswordUpdateMutation({
    onSuccess: () => {
      toast.success('Password updated successfully')
      form.reset()
    },
  })

  const onSubmit: SubmitHandler<z.infer<typeof FormSchema>> = (values) => {
    updatePassword({ currentPassword: values.currentPassword, newPassword: values.newPassword })
  }

  return (
    <PageSection>
      <PageSectionMeta>
        <PageSectionSummary>
          <PageSectionTitle>Password</PageSectionTitle>
          <PageSectionDescription>
            Change the password used to sign in to this dashboard.
          </PageSectionDescription>
        </PageSectionSummary>
      </PageSectionMeta>
      <PageSectionContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <Card>
              <CardContent>
                <FormField
                  name="currentPassword"
                  control={form.control}
                  render={({ field }) => (
                    <FormItemLayout layout="flex-row-reverse" label="Current password">
                      <FormControl>
                        <Input {...field} type="password" autoComplete="current-password" />
                      </FormControl>
                    </FormItemLayout>
                  )}
                />
              </CardContent>
              <CardContent>
                <FormField
                  name="newPassword"
                  control={form.control}
                  render={({ field }) => (
                    <FormItemLayout layout="flex-row-reverse" label="New password">
                      <FormControl>
                        <Input {...field} type="password" autoComplete="new-password" />
                      </FormControl>
                    </FormItemLayout>
                  )}
                />
              </CardContent>
              <CardContent>
                <FormField
                  name="confirmPassword"
                  control={form.control}
                  render={({ field }) => (
                    <FormItemLayout layout="flex-row-reverse" label="Confirm new password">
                      <FormControl>
                        <Input {...field} type="password" autoComplete="new-password" />
                      </FormControl>
                    </FormItemLayout>
                  )}
                />
              </CardContent>
              <CardFooter className="justify-end">
                <Button type="submit" loading={isPending} disabled={isPending}>
                  Update password
                </Button>
              </CardFooter>
            </Card>
          </form>
        </Form>
      </PageSectionContent>
    </PageSection>
  )
}
