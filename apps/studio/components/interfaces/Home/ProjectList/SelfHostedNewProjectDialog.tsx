import { zodResolver } from '@hookform/resolvers/zod'
import { Plus } from 'lucide-react'
import { useState } from 'react'
import { SubmitHandler, useForm, useWatch } from 'react-hook-form'
import { toast } from 'sonner'
import {
  Button,
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogSection,
  DialogTitle,
  Form,
  FormControl,
  FormField,
  Input,
  RadioGroup,
  RadioGroupItem,
  Separator,
} from 'ui'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'
import * as z from 'zod'

import { useSelfHostedProjectCreateMutation } from '@/data/projects/selfhosted-project-create-mutation'

const FORM_ID = 'selfhosted-new-project-form'

const FormSchema = z
  .object({
    name: z.string().trim().min(1, 'Project name is required'),
    kind: z.enum(['compose', 'external']),
    dbConnectionString: z.string().trim(),
  })
  .superRefine((val, ctx) => {
    if (val.kind === 'external' && !/^postgres(ql)?:\/\//.test(val.dbConnectionString)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['dbConnectionString'],
        message: 'A postgresql:// connection string is required for external databases',
      })
    }
  })

export const SelfHostedNewProjectDialog = () => {
  const [visible, setVisible] = useState(false)

  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: { name: '', kind: 'compose', dbConnectionString: '' },
  })

  const { mutate: createProject, isPending } = useSelfHostedProjectCreateMutation({
    onSuccess: (data) => {
      toast.success(`Project "${data.name}" is being created`)
      setVisible(false)
      form.reset()
    },
  })

  const kind = useWatch({ control: form.control, name: 'kind' })

  const onSubmit: SubmitHandler<z.infer<typeof FormSchema>> = (values) => {
    createProject({
      name: values.name,
      kind: values.kind,
      dbConnectionString: values.kind === 'external' ? values.dbConnectionString : undefined,
    })
  }

  return (
    <>
      <Button icon={<Plus />} variant="primary" size="tiny" onClick={() => setVisible(true)}>
        New project
      </Button>
      <Dialog open={visible} onOpenChange={(open) => setVisible(open)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create a new project</DialogTitle>
          </DialogHeader>
          <Separator />
          <DialogSection>
            <Form {...form}>
              <form id={FORM_ID} onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItemLayout label="Project name">
                      <FormControl>
                        <Input {...field} placeholder="My project" />
                      </FormControl>
                    </FormItemLayout>
                  )}
                />
                <FormField
                  control={form.control}
                  name="kind"
                  render={({ field }) => (
                    <FormItemLayout
                      label="Project type"
                      description={
                        field.value === 'compose'
                          ? 'Provisions a full local stack (Postgres, Auth, REST, Storage, Functions)'
                          : 'Connects an existing PostgreSQL database (SQL editor and table browsing)'
                      }
                    >
                      <FormControl>
                        <RadioGroup
                          value={field.value}
                          onValueChange={field.onChange}
                          className="flex flex-col gap-2"
                        >
                          <label htmlFor="project-kind-compose" className="flex items-center gap-2 text-sm">
                            <RadioGroupItem id="project-kind-compose" value="compose" /> Local stack
                          </label>
                          <label htmlFor="project-kind-external" className="flex items-center gap-2 text-sm">
                            <RadioGroupItem id="project-kind-external" value="external" /> External
                            database
                          </label>
                        </RadioGroup>
                      </FormControl>
                    </FormItemLayout>
                  )}
                />
                {kind === 'external' && (
                  <FormField
                    control={form.control}
                    name="dbConnectionString"
                    render={({ field }) => (
                      <FormItemLayout
                        label="Connection string"
                        description="Stored encrypted; never shown in the dashboard again"
                      >
                        <FormControl>
                          <Input
                            {...field}
                            type="password"
                            placeholder="postgresql://user:password@host:5432/postgres"
                          />
                        </FormControl>
                      </FormItemLayout>
                    )}
                  />
                )}
              </form>
            </Form>
          </DialogSection>
          <DialogFooter>
            <Button disabled={isPending} variant="default" onClick={() => setVisible(false)}>
              Cancel
            </Button>
            <Button form={FORM_ID} type="submit" disabled={isPending} loading={isPending}>
              Create project
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
