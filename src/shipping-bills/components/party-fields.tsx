import { getDemoData } from '@/shipping-bills/demo-store'
import { Business, Exporter, ShippingBillFormValues } from '@/shipping-bills/model'
import { partyMockService } from '@/shipping-bills/party-mock-service'
import { useForm } from 'core/form'
import { useEffect } from 'react'
import { AsyncPartySelect } from './async-party-select'

export type BillFormContext = ReturnType<typeof useForm<ShippingBillFormValues>>

export type BranchPath =
  | 'exporterBranchId'
  | 'consigneeBranchId'
  | `invoices.${number}.buyerBranchId`
  | `invoices.${number}.thirdPartyBranchId`
  | `invoices.${number}.items.${number}.itemThirdPartyBranchId`

export interface PartyFieldsProps {
  formCtx: BillFormContext
  ownerName:
    | 'exporterId'
    | 'consigneeId'
    | `invoices.${number}.buyerId`
    | `invoices.${number}.thirdPartyId`
    | `invoices.${number}.items.${number}.itemThirdPartyId`
  branchName: BranchPath
  label: string
  kind: 'exporter' | 'business'
  parties: (Exporter | Business)[]
  required?: boolean
  onAddBranch: (ownerId: number) => void
  onQuickAdd: () => void
}

export function PartyFields({
  formCtx,
  ownerName,
  branchName,
  label,
  kind,
  parties,
  required = true,
  onAddBranch,
  onQuickAdd
}: PartyFieldsProps) {
  const ownerId = formCtx.hooks.watch(ownerName)
  const { exporters, businesses } = getDemoData()
  const owner =
    kind === 'exporter'
      ? (exporters.find((party) => String(party.id) === ownerId) ??
        parties.find((party) => String(party.id) === ownerId))
      : (businesses.find((party) => String(party.id) === ownerId) ??
        parties.find((party) => String(party.id) === ownerId))

  // Clear branch when switching to a different party whose branches do not include it
  useEffect(() => {
    const selectedBranch = formCtx.hooks.getValues(branchName)
    if (
      selectedBranch &&
      owner &&
      owner.branches.length > 0 &&
      !owner.branches.some((branch) => String(branch.id) === selectedBranch)
    ) {
      formCtx.hooks.setValue(branchName, '', { shouldValidate: true })
    }
  }, [branchName, formCtx.hooks, owner])

  return (
    <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
      <div>
        <div className="mb-1 flex items-center justify-between gap-2">
          <label className="text-sm font-medium text-gray-900">
            {label} {required && <span className="text-rose-500">*</span>}
          </label>
          <button
            type="button"
            className="text-primary-700 text-xs font-medium hover:underline focus:outline-none"
            onClick={onQuickAdd}
            aria-label={`Add new ${kind}`}>
            + Add new
          </button>
        </div>
        <AsyncPartySelect
          name={ownerName}
          control={formCtx.hooks.control}
          setValue={formCtx.hooks.setValue}
          placeholder={`Search & select ${kind}...`}
          rules={{ required }}
          fetchOptions={async (query) => {
            if (kind === 'exporter') {
              const res = await partyMockService.searchExporters(query)
              return res.map((item) => ({
                value: String(item.id),
                label: item.name,
                sublabel: item.iec ? `IEC: ${item.iec}` : undefined
              }))
            } else {
              const res = await partyMockService.searchConsignees(query)
              return res.map((item) => ({
                value: String(item.id),
                label: item.name
              }))
            }
          }}
          getInitialLabel={async (id) => {
            if (kind === 'exporter') {
              const item = await partyMockService.getExporterById(id)
              return item ? item.name : ''
            } else {
              const item = await partyMockService.getConsigneeById(id)
              return item ? item.name : ''
            }
          }}
        />
      </div>
      <div>
        <div className="mb-1 flex items-center justify-between gap-2">
          <label className="text-sm font-medium text-gray-900">
            Branch / address {(required || Boolean(ownerId)) && <span className="text-rose-500">*</span>}
          </label>
          {owner && (
            <button
              type="button"
              className="text-primary-700 text-xs font-medium hover:underline focus:outline-none"
              onClick={() => onAddBranch(owner.id)}
              aria-label={`Add branch for ${owner.name}`}>
              + Add branch
            </button>
          )}
        </div>
        <AsyncPartySelect
          name={branchName}
          control={formCtx.hooks.control}
          setValue={formCtx.hooks.setValue}
          placeholder={owner ? 'Search & select branch...' : `Choose ${kind} first`}
          disabled={!owner}
          rules={{ required: required || !!ownerId }}
          deps={[ownerId]}
          fetchOptions={async (query) => {
            if (!ownerId) return []
            if (kind === 'exporter') {
              const res = await partyMockService.searchExporterBranches(ownerId, query)
              return res.map((branch) => ({
                value: String(branch.id),
                label: `${branch.branchName} · ${branch.city}`,
                sublabel: branch.address1
              }))
            } else {
              const res = await partyMockService.searchConsigneeBranches(ownerId, query)
              return res.map((branch) => ({
                value: String(branch.id),
                label: `${branch.branchName} · ${branch.city}`,
                sublabel: branch.address1
              }))
            }
          }}
          getInitialLabel={async (id) => {
            const branch = owner?.branches.find((b) => String(b.id) === id)
            return branch ? `${branch.branchName} · ${branch.city}` : ''
          }}
        />
      </div>
    </div>
  )
}
