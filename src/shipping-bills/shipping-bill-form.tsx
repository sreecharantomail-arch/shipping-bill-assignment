import { routes } from '@/shared/route-paths'
import { s, useFieldArray, useForm } from 'core/form'
import { Form } from 'core/form/components'
import { navigate, useParams } from 'core/routing'
import { toast } from 'core/toast-manager'
import { useEffect, useRef, useState } from 'react'
import { Button } from 'ui/basic/button'
import { Tabs, TabsList, TabsTrigger } from 'ui/interactive/tabs'
import { PersistentTab } from './components/common-sections'
import { InvoiceCard } from './components/invoice-card'
import { BranchPath } from './components/party-fields'
import { OthersTab } from './components/tabs/others-tab'
import { ShipmentBasicsTab } from './components/tabs/shipment-basics-tab'
import { saveBill, useDemoData } from './demo-store'
import { getMarksAndNumbersOptions, MarksAndNumbersOption } from './marks-and-numbers-source'
import { Branch, Business, emptyBill, emptyInvoice, Exporter, SavedBill, ShippingBillFormValues } from './model'
import { BranchDialog, PartyDialog } from './party-dialogs'
import { shippingBillService } from './shipping-bill-service'
import { workflowSteps } from './workflow'

const positive = s.string().refine((value) => (Number(value) > 0 ? undefined : 'Enter a number above zero'))

// Leaf names are deliberate: fe-zen-arch resolves nested RHF field rules by their final path segment.
const billSchema = s.object({
  jobNumber: s.string().optional(),
  jobDate: s.string(),
  exporterId: s.string(),
  exporterBranchId: s.string(),
  consigneeId: s.string(),
  consigneeBranchId: s.string(),
  loadingPort: s.string(),
  finalDestinationPort: s.string(),
  dischargePort: s.string().optional(),
  originStateCode: s.string().optional(),
  nfeiCategory: s.string().optional(),
  rbiWaiverNumber: s.string().optional(),
  rbiWaiverDate: s.string().optional(),
  sealType: s.string().optional(),
  numberOfContainers: s.string().optional(),
  natureOfCargo: s.string().optional(),
  grossWeight: s.string().optional(),
  netWeight: s.string().optional(),
  measurementUnit: s.string().optional(),
  totalPackages: s.string().optional(),
  marksAndNumbers: s.string().optional(),
  loosePackets: s.string().optional(),
  mawbNumber: s.string().optional(),
  hawbNumber: s.string().optional(),
  invoiceNumber: s.string(),
  invoiceDate: s.string(),
  currency: s.string(),
  invoiceTotal: s
    .string()
    .refine((value) => (!value || Number(value) >= 0 ? undefined : 'Total cannot be negative'))
    .optional(),
  contractType: s.string(),
  buyerId: s.string().optional(),
  buyerBranchId: s.string().optional(),
  thirdPartyId: s.string().optional(),
  thirdPartyBranchId: s.string().optional(),
  ritcCode: s.string(),
  goodsDescription1: s.string(),
  quantity: positive,
  unitOfMeasurement: s.string(),
  unitPrice: positive,
  containerNumber: s.string().optional(),
  packingNumberFrom: s.string().optional(),
  packingNumberTo: s.string().optional(),
  documentTypeCode: s.string().optional(),
  documentReferenceNumber: s.string().optional(),
  registrationNumber: s.string().optional()
})

interface QuickAdd {
  kind: 'exporter' | 'business'
  role?: 'consignee' | 'buyer' | 'thirdParty' | 'itemThirdParty'
  invoiceIndex?: number
  itemIndex?: number
}

interface QuickBranch {
  kind: 'exporter' | 'business'
  ownerId: number
  branchName: BranchPath
}

export function BillEditor({ bill }: { bill?: SavedBill }) {
  const { exporters, businesses } = useDemoData()
  const formCtx = useForm<ShippingBillFormValues>(billSchema, { defaultValues: bill?.values ?? emptyBill() })
  const { control, setValue, formState } = formCtx.hooks
  const values = formCtx.hooks.watch()

  const { fields: invoices, append: addInvoice, remove: removeInvoice } = useFieldArray({ control, name: 'invoices' })
  const {
    fields: containers,
    append: addContainer,
    remove: removeContainer
  } = useFieldArray({
    control,
    name: 'containers'
  })
  const {
    fields: packingRanges,
    append: addPackingRange,
    remove: removePackingRange
  } = useFieldArray({
    control,
    name: 'packingRanges'
  })
  const {
    fields: documents,
    append: addDocument,
    remove: removeDocument
  } = useFieldArray({
    control,
    name: 'documents'
  })
  const {
    fields: licenses,
    append: addLicense,
    remove: removeLicense
  } = useFieldArray({
    control,
    name: 'licenses'
  })

  const [activeTab, setActiveTab] = useState('details')
  const [draftId, setDraftId] = useState<number | undefined>(bill?.id)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [quickAdd, setQuickAdd] = useState<QuickAdd | null>(null)
  const [quickBranch, setQuickBranch] = useState<QuickBranch | null>(null)
  const [marksAndNumbersOptions, setMarksAndNumbersOptions] = useState<MarksAndNumbersOption[]>([])
  const [marksAndNumbersLoading, setMarksAndNumbersLoading] = useState(false)
  const previousExporterId = useRef(values.exporterId)

  const consigneeOptions = businesses.filter(
    (business) => business.isConsignee || String(business.id) === values.consigneeId
  )

  // Reset and reload marks & numbers when exporter changes
  useEffect(() => {
    const exporterId = values.exporterId
    if (previousExporterId.current !== exporterId) {
      previousExporterId.current = exporterId
      setValue('marksAndNumbers', '', { shouldValidate: true })
    }

    let cancelled = false
    setMarksAndNumbersOptions([])
    setMarksAndNumbersLoading(Boolean(exporterId))
    if (exporterId) {
      void getMarksAndNumbersOptions(exporterId)
        .then((options) => {
          if (cancelled) return
          setMarksAndNumbersOptions(options)
          setMarksAndNumbersLoading(false)
        })
        .catch(() => {
          if (cancelled) return
          setMarksAndNumbersOptions([])
          setMarksAndNumbersLoading(false)
        })
    }

    return () => {
      cancelled = true
    }
  }, [setValue, values.exporterId])

  // Auto-populate origin state when exporter branch is selected and state is empty
  useEffect(() => {
    if (!values.exporterId || !values.exporterBranchId) return
    const exporter = exporters.find((item) => String(item.id) === values.exporterId)
    const branch = exporter?.branches.find((b) => String(b.id) === values.exporterBranchId)
    if (branch && branch.state) {
      const currentState = formCtx.hooks.getValues('originStateCode')
      if (!currentState) {
        setValue('originStateCode', branch.state, { shouldValidate: true })
      }
    }
  }, [values.exporterId, values.exporterBranchId, exporters, setValue, formCtx.hooks])

  // Automatically switch tabs if validation fails on submit
  useEffect(() => {
    if (!formState.submitCount || !Object.keys(formState.errors).length) return
    console.log('Form validation errors on submit:', formState.errors)
    toast.error('Please check the required fields')
    if (
      [
        'jobDate',
        'exporterId',
        'exporterBranchId',
        'consigneeId',
        'consigneeBranchId',
        'loadingPort',
        'finalDestinationPort'
      ].some((field) => field in formState.errors)
    ) {
      setActiveTab('details')
    } else if (formState.errors.invoices) {
      setActiveTab('invoices')
    } else if (
      formState.errors.containers ||
      formState.errors.packingRanges ||
      formState.errors.documents ||
      formState.errors.licenses
    ) {
      setActiveTab('documents')
    }
  }, [formState.submitCount, formState.errors])

  // Reliable, double-submission-proof submit handler with full error feedback
  async function handleSave(data: ShippingBillFormValues) {
    if (isSubmitting) return

    // Sensible customs domain validation: Net weight cannot exceed Gross weight
    if (data.grossWeight && data.netWeight) {
      if (Number(data.netWeight) > Number(data.grossWeight)) {
        toast.error('Domain Validation: Net weight cannot exceed gross weight')
        setActiveTab('details')
        return
      }
    }

    // Domain validation: Loading port and Destination port cannot be identical
    if (data.loadingPort && data.finalDestinationPort && data.loadingPort === data.finalDestinationPort) {
      toast.error('Domain Validation: Loading port and final destination port cannot be the same')
      setActiveTab('details')
      return
    }

    // Domain validation: Containerized cargo requires container details
    if (
      (data.natureOfCargo === 'C' || data.natureOfCargo === 'CP') &&
      (!data.containers || data.containers.length === 0)
    ) {
      toast.error('Domain Validation: Cargo nature is containerized. Please add at least one container in Tab 3.')
      setActiveTab('documents')
      return
    }

    // Domain validation: Packing range from must be <= to
    if (data.packingRanges && data.packingRanges.length > 0) {
      for (let i = 0; i < data.packingRanges.length; i++) {
        const r = data.packingRanges[i]
        if (r.packingNumberFrom && r.packingNumberTo && Number(r.packingNumberFrom) > Number(r.packingNumberTo)) {
          toast.error(`Domain Validation: Packing range ${i + 1} 'From' number cannot exceed 'To' number`)
          setActiveTab('documents')
          return
        }
      }
    }

    setIsSubmitting(true)
    try {
      // Save locally first to preserve work immediately
      const localDraft = saveBill(data, draftId)
      setDraftId(localDraft.id)

      // Submit to shipping bill service asynchronously
      const saved = await shippingBillService.upsert(data, localDraft.id)

      toast.success(bill ? 'Shipping bill updated successfully' : 'Shipping bill created successfully')
      navigate(routes.toShippingBillEdit(saved.id))
    } catch (err: any) {
      console.error('Error saving shipping bill:', err)
      toast.error(err?.message || 'Failed to save shipping bill. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  function handleQuickSaved(party: Exporter | Business) {
    const branchId = party.branches[0]?.id
    if (!quickAdd || !branchId) return
    if (quickAdd.kind === 'exporter') {
      setValue('exporterId', String(party.id), { shouldValidate: true })
      setValue('exporterBranchId', String(branchId), { shouldValidate: true })
    } else if (quickAdd.role === 'consignee') {
      setValue('consigneeId', String(party.id), { shouldValidate: true })
      setValue('consigneeBranchId', String(branchId), { shouldValidate: true })
    } else if (quickAdd.role === 'itemThirdParty' && quickAdd.invoiceIndex != null && quickAdd.itemIndex != null) {
      setValue(`invoices.${quickAdd.invoiceIndex}.items.${quickAdd.itemIndex}.itemThirdPartyId`, String(party.id), {
        shouldValidate: true
      })
      setValue(
        `invoices.${quickAdd.invoiceIndex}.items.${quickAdd.itemIndex}.itemThirdPartyBranchId`,
        String(branchId),
        { shouldValidate: true }
      )
    } else if (quickAdd.invoiceIndex != null) {
      const field = quickAdd.role === 'buyer' ? 'buyer' : 'thirdParty'
      setValue(`invoices.${quickAdd.invoiceIndex}.${field}Id`, String(party.id), { shouldValidate: true })
      setValue(`invoices.${quickAdd.invoiceIndex}.${field}BranchId`, String(branchId), { shouldValidate: true })
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <button
            type="button"
            className="mb-2 text-sm text-gray-500 hover:underline focus:outline-none"
            onClick={() => navigate(routes.dashboard)}>
            ← Shipping bills
          </button>
          <h1 className="text-2xl font-semibold text-gray-950">
            {bill ? `Edit shipping bill #${bill.id}` : 'New shipping bill'}
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Enter the everyday details first. Open advanced sections only when needed.
          </p>
        </div>
      </div>

      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        {workflowSteps.map((step, index) => {
          const isActive = step.id === 'shipping-bill' || step.description === 'Current step'
          const cardClasses = isActive
            ? 'border-primary-300 bg-primary-50 text-slate-900'
            : 'border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-50 text-gray-900 dark:text-white'
          const titleClasses = isActive ? 'font-semibold text-slate-900' : 'text-gray-900 dark:text-white'
          const subtitleClasses = isActive ? 'text-slate-700' : 'text-gray-500 dark:text-slate-300'
          const indicatorClasses = isActive
            ? 'border-primary-300 border bg-white text-slate-900 shadow-xs'
            : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-slate-200 border'

          return (
            <div key={step.id} className={`rounded-lg border p-3 ${cardClasses}`}>
              <div className="flex items-center gap-2 text-sm font-medium">
                <span
                  className={`flex size-6 items-center justify-center rounded-full text-xs font-semibold ${indicatorClasses}`}>
                  {index + 1}
                </span>
                <span className={titleClasses}>{step.title}</span>
              </div>
              <p className={`ml-8 text-xs ${subtitleClasses}`}>{step.description}</p>
            </div>
          )
        })}
      </div>

      <Form ctx={formCtx} handleSubmit={handleSave} className="space-y-5">
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(String(value))}>
          <TabsList className="flex w-full justify-start overflow-x-auto">
            <TabsTrigger value="details">1. Details</TabsTrigger>
            <TabsTrigger value="invoices">2. Invoices & goods</TabsTrigger>
            <TabsTrigger value="documents">3. Others</TabsTrigger>
          </TabsList>

          <ShipmentBasicsTab
            formCtx={formCtx}
            activeTab={activeTab}
            exporters={exporters}
            consigneeOptions={consigneeOptions}
            values={values}
            containersCount={containers.length}
            marksAndNumbersOptions={marksAndNumbersOptions}
            marksAndNumbersLoading={marksAndNumbersLoading}
            onQuickAdd={(kind, role) => setQuickAdd({ kind, role })}
            onAddBranch={(kind, ownerId, branchName) => setQuickBranch({ kind, ownerId, branchName })}
          />

          <PersistentTab value="invoices" activeTab={activeTab} className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-semibold text-gray-950">Invoices & goods</h2>
                <p className="text-sm text-gray-500">One invoice and one item are ready to fill in.</p>
              </div>
              <Button
                variant="outline"
                type="button"
                onClick={() => addInvoice(emptyInvoice())}
                disabled={isSubmitting}>
                + Add invoice
              </Button>
            </div>
            {invoices.map((field, index) => (
              <InvoiceCard
                key={field.id}
                formCtx={formCtx}
                index={index}
                invoice={values.invoices[index] ?? emptyInvoice()}
                businesses={businesses}
                onQuickAdd={(role, invoiceIndex, itemIndex) =>
                  setQuickAdd({ kind: 'business', role, invoiceIndex, itemIndex })
                }
                onAddBranch={(ownerId, branchName) => setQuickBranch({ kind: 'business', ownerId, branchName })}
                onRemove={() => removeInvoice(index)}
                canRemove={invoices.length > 1}
              />
            ))}
          </PersistentTab>

          <OthersTab
            formCtx={formCtx}
            activeTab={activeTab}
            containers={containers}
            packingRanges={packingRanges}
            documents={documents}
            licenses={licenses}
            addContainer={addContainer}
            removeContainer={removeContainer}
            addPackingRange={addPackingRange}
            removePackingRange={removePackingRange}
            addDocument={addDocument}
            removeDocument={removeDocument}
            addLicense={addLicense}
            removeLicense={removeLicense}
          />
        </Tabs>

        <div className="flex flex-wrap justify-between gap-2 border-t border-gray-200 pt-4">
          <Button variant="outline" type="button" onClick={() => navigate(routes.dashboard)} disabled={isSubmitting}>
            Cancel
          </Button>
          <div className="flex gap-2">
            {activeTab !== 'details' && (
              <Button
                variant="outline"
                type="button"
                disabled={isSubmitting}
                onClick={() => {
                  const current = formCtx.hooks.getValues()
                  const saved = saveBill(current, draftId)
                  setDraftId(saved.id)
                  setActiveTab(activeTab === 'documents' ? 'invoices' : 'details')
                }}>
                Previous
              </Button>
            )}
            {activeTab !== 'documents' ? (
              <Button
                type="button"
                disabled={isSubmitting}
                onClick={(e) => {
                  e.preventDefault()
                  const current = formCtx.hooks.getValues()
                  const saved = saveBill(current, draftId)
                  setDraftId(saved.id)
                  toast.success('Draft saved')
                  setActiveTab(activeTab === 'details' ? 'invoices' : 'documents')
                }}>
                Save & Next
              </Button>
            ) : (
              <Button type="submit" disabled={isSubmitting} aria-busy={isSubmitting}>
                {isSubmitting ? (
                  <span className="flex items-center gap-2">
                    <span className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    Saving shipping bill...
                  </span>
                ) : bill ? (
                  'Save changes'
                ) : (
                  'Create shipping bill'
                )}
              </Button>
            )}
          </div>
        </div>
      </Form>

      {quickAdd && (
        <PartyDialog
          key={`${quickAdd.kind}-${quickAdd.role ?? 'exporter'}-${quickAdd.invoiceIndex ?? 0}`}
          kind={quickAdd.kind}
          initialRole={quickAdd.role === 'itemThirdParty' ? 'thirdParty' : quickAdd.role}
          onClose={() => setQuickAdd(null)}
          onSaved={handleQuickSaved}
        />
      )}
      {quickBranch && (
        <BranchDialog
          key={`${quickBranch.kind}-${quickBranch.ownerId}`}
          kind={quickBranch.kind}
          ownerId={quickBranch.ownerId}
          onClose={() => setQuickBranch(null)}
          onSaved={(branch: Branch) => setValue(quickBranch.branchName, String(branch.id), { shouldValidate: true })}
        />
      )}
    </div>
  )
}

export default function ShippingBillPage() {
  const { id } = useParams<{ id?: string }>()
  const { bills } = useDemoData()
  const bill = id ? bills.find((item) => item.id === Number(id)) || shippingBillService.getById(id) : undefined

  if (id && !bill) {
    return (
      <div className="space-y-3">
        <h1 className="text-xl font-semibold text-gray-950">Shipping bill not found</h1>
        <Button onClick={() => navigate(routes.dashboard)}>Back to list</Button>
      </div>
    )
  }

  return <BillEditor key={id ?? 'new'} bill={bill} />
}
