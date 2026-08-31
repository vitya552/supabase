import { zodResolver } from '@hookform/resolvers/zod'
import { SubmitHandler, useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { Button, Card, CardContent, CardFooter, Form, FormControl, FormField, Input } from 'ui'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'
import {
  PageSection,
  PageSectionContent,
  PageSectionMeta,
  PageSectionSummary,
  PageSectionTitle,
} from 'ui-patterns/PageSection'
import z from 'zod'

import { useProfileUpdateMutation } from '@/data/profile/profile-update-mutation'
import { useProfile } from '@/lib/profile'

const FormSchema = z.object({
  first_name: z.string(),
  last_name: z.string(),
})

const formId = 'dashboard-profile-information-form'

/** Self-hosted profile details, stored on the dashboard user in the management API. */
export const DashboardProfileInformation = () => {
  const { profile } = useProfile()

  const defaultValues = {
    first_name: profile?.first_name ?? '',
    last_name: profile?.last_name ?? '',
  }

  const form = useForm({
    resolver: zodResolver(FormSchema),
    defaultValues,
    values: defaultValues,
  })

  const { mutate: updateProfile, isPending: isUpdatingProfile } = useProfileUpdateMutation({
    onSuccess: (data) => {
      toast.success('Successfully saved profile')
      form.reset({
        first_name: data.first_name ?? '',
        last_name: data.last_name ?? '',
      })
    },
    onError: (error) => toast.error(`Failed to update profile: ${error.message}`),
  })

  const onSubmit: SubmitHandler<z.infer<typeof FormSchema>> = (data) => {
    updateProfile({
      firstName: data.first_name,
      lastName: data.last_name,
      username: profile?.username ?? '',
      primaryEmail: profile?.primary_email ?? '',
    })
  }

  return (
    <PageSection>
      <PageSectionMeta>
        <PageSectionSummary>
          <PageSectionTitle>Profile information</PageSectionTitle>
        </PageSectionSummary>
      </PageSectionMeta>
      <PageSectionContent>
        <Form {...form}>
          <form id={formId} className="space-y-6 w-full" onSubmit={form.handleSubmit(onSubmit)}>
            <Card>
              <CardContent>
                <FormField
                  control={form.control}
                  name="first_name"
                  render={({ field }) => (
                    <FormItemLayout label="First name" layout="flex-row-reverse">
                      <FormControl className="col-span-8">
                        <Input {...field} placeholder="First name" className="w-full" />
                      </FormControl>
                    </FormItemLayout>
                  )}
                />
              </CardContent>
              <CardContent>
                <FormField
                  control={form.control}
                  name="last_name"
                  render={({ field }) => (
                    <FormItemLayout label="Last name" layout="flex-row-reverse">
                      <FormControl className="col-span-8">
                        <Input {...field} placeholder="Last name" className="w-full" />
                      </FormControl>
                    </FormItemLayout>
                  )}
                />
              </CardContent>
              <CardContent>
                <FormItemLayout
                  label="Username"
                  description="The username you sign in with; it cannot be changed here"
                  layout="flex-row-reverse"
                >
                  <Input
                    disabled
                    value={profile?.username ?? ''}
                    className="w-full col-span-8"
                    placeholder="Username"
                  />
                </FormItemLayout>
              </CardContent>
              <CardFooter className="justify-end space-x-2">
                {form.formState.isDirty && (
                  <Button variant="default" onClick={() => form.reset()}>
                    Cancel
                  </Button>
                )}
                <Button
                  variant="primary"
                  type="submit"
                  loading={isUpdatingProfile}
                  disabled={!form.formState.isDirty}
                >
                  Save
                </Button>
              </CardFooter>
            </Card>
          </form>
        </Form>
      </PageSectionContent>
    </PageSection>
  )
}
