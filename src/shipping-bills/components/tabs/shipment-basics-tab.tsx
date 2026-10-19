import { useBasicsReferenceData } from '@/shipping-bills/hooks/use-reference-data'
import { MarksAndNumbersOption } from '@/shipping-bills/marks-and-numbers-source'
import { Business, Exporter, portCountry, ShippingBillFormValues } from '@/shipping-bills/model'
import { partyMockService } from '@/shipping-bills/party-mock-service'
import { Card, CardContent, CardHeader } from 'ui/basic/card'
import { Input } from 'ui/inputs/input'
import { Select } from 'ui/inputs/select'
import { AsyncPartySelect } from '../async-party-select'
import { Advanced, PersistentTab, SectionHeading } from '../common-sections'
import { BillFormContext, BranchPath, PartyFields } from '../party-fields'

const dateType = 'date' as 'text'

export interface ShipmentBasicsTabProps {
  formCtx: BillFormContext
  activeTab: string
  exporters: Exporter[]
  consigneeOptions: Business[]
  values: ShippingBillFormValues
  containersCount: number
  marksAndNumbersOptions: MarksAndNumbersOption[]
  marksAndNumbersLoading: boolean
  onQuickAdd: (kind: 'exporter' | 'business', role?: 'consignee') => void
  onAddBranch: (kind: 'exporter' | 'business', ownerId: number, branchName: BranchPath) => void
}

export function ShipmentBasicsTab({
  formCtx,
  activeTab,
  exporters,
  consigneeOptions,
  values,
  containersCount,
  marksAndNumbersOptions,
  marksAndNumbersLoading,
  onQuickAdd,
  onAddBranch
}: ShipmentBasicsTabProps) {
  const { register } = formCtx.hooks
  const {
    cargoOptions,
    sealTypes,
    weightUnits,
    stateOptions,
    nfeiCategoryOptions,
    dischargePortOptions,
    isLoading: isBasicsLoading
  } = useBasicsReferenceData()

  return (
    <PersistentTab value="details" activeTab={activeTab} className="space-y-4">
      <Card>
        <CardHeader title="Shipment basics" description="Parties and route are the core details for this bill." />
        <CardContent className="space-y-5">
          <PartyFields
            formCtx={formCtx}
            ownerName="exporterId"
            branchName="exporterBranchId"
            label="Exporter"
            kind="exporter"
            parties={exporters.filter((item) => !item.disabled || String(item.id) === values.exporterId)}
            onQuickAdd={() => onQuickAdd('exporter')}
            onAddBranch={(ownerId) => onAddBranch('exporter', ownerId, 'exporterBranchId')}
          />
          <PartyFields
            formCtx={formCtx}
            ownerName="consigneeId"
            branchName="consigneeBranchId"
            label="Consignee"
            kind="business"
            parties={consigneeOptions}
            onQuickAdd={() => onQuickAdd('business', 'consignee')}
            onAddBranch={(ownerId) => onAddBranch('business', ownerId, 'consigneeBranchId')}
          />

          <div className="border-t border-gray-200 pt-5">
            <SectionHeading title="Route" description="Select loading and destination ports for this shipment." />
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-900">
                  Port of loading <span className="text-rose-500">*</span>
                </label>
                <AsyncPartySelect
                  name="loadingPort"
                  control={formCtx.hooks.control}
                  setValue={formCtx.hooks.setValue}
                  placeholder="Select Indian loading port..."
                  rules={{ required: true }}
                  fetchOptions={async (query) => {
                    const res = await partyMockService.searchLoadingPorts(query)
                    return res.map((port) => ({
                      value: port.code,
                      label: `${port.name} · ${port.code}`,
                      sublabel: `Country: ${port.countryCode}`
                    }))
                  }}
                  getInitialLabel={async (code) => {
                    const port = await partyMockService.getPortByCode(code)
                    return port ? `${port.name} · ${port.code}` : code
                  }}
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-900">
                  Final destination port <span className="text-rose-500">*</span>
                </label>
                <AsyncPartySelect
                  name="finalDestinationPort"
                  control={formCtx.hooks.control}
                  setValue={formCtx.hooks.setValue}
                  placeholder="Select destination port..."
                  rules={{ required: true }}
                  fetchOptions={async (query) => {
                    const res = await partyMockService.searchDestinationPorts(query)
                    return res.map((port) => ({
                      value: port.code,
                      label: `${port.name} · ${port.code}`,
                      sublabel: `Country: ${port.countryCode}`
                    }))
                  }}
                  getInitialLabel={async (code) => {
                    const port = await partyMockService.getPortByCode(code)
                    return port ? `${port.name} · ${port.code}` : code
                  }}
                />
              </div>
            </div>
            <p className="mt-3 text-xs text-gray-500" role="status" aria-live="polite">
              Countries are derived from port codes when saved:{' '}
              <span className="font-medium text-gray-700">{portCountry(values.loadingPort) || '—'}</span> →{' '}
              <span className="font-medium text-gray-700">{portCountry(values.finalDestinationPort) || '—'}</span>.
            </p>
          </div>

          <Advanced title="Regulatory and route exceptions">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <Select<ShippingBillFormValues>
                label="Discharge port"
                name="dischargePort"
                options={dischargePortOptions}
                placeholder={isBasicsLoading ? 'Loading ports...' : 'Defaults to destination port'}
                disabled={isBasicsLoading}
              />
              <Select<ShippingBillFormValues>
                label="Origin state"
                name="originStateCode"
                options={stateOptions}
                placeholder={isBasicsLoading ? 'Loading states...' : 'Defaults to Branch State Code'}
                disabled={isBasicsLoading}
              />
              <div />
              <Select<ShippingBillFormValues>
                label="NFEI category"
                name="nfeiCategory"
                options={nfeiCategoryOptions}
                placeholder={isBasicsLoading ? 'Loading categories...' : 'Not applicable'}
                disabled={isBasicsLoading}
              />
              <Input label="RBI waiver number" {...register('rbiWaiverNumber')} />
              <Input label="RBI waiver date" type={dateType} {...register('rbiWaiverDate')} />
            </div>
          </Advanced>

          <div className="border-t border-gray-200 pt-5">
            <SectionHeading title="Package Detail" description="Cargo nature, weights, and packaging numbers." />
            <div className="grid gap-4 pb-4 sm:grid-cols-2 lg:grid-cols-4">
              <Select<ShippingBillFormValues>
                label="Nature of cargo"
                name="natureOfCargo"
                options={cargoOptions}
                placeholder={isBasicsLoading ? 'Loading...' : undefined}
                disabled={isBasicsLoading}
              />
              <Input label="Gross weight" type="number" min={0} {...register('grossWeight')} />
              <Input label="Net weight" type="number" min={0} {...register('netWeight')} />
              <Select<ShippingBillFormValues>
                label="Weight unit"
                name="measurementUnit"
                options={weightUnits}
                placeholder={isBasicsLoading ? 'Loading...' : undefined}
                disabled={isBasicsLoading}
              />
              <Input label="Total packages" type="number" min={0} {...register('totalPackages')} />
              <Select<ShippingBillFormValues>
                label="Marks and numbers"
                name="marksAndNumbers"
                options={marksAndNumbersOptions}
                placeholder={
                  !values.exporterId
                    ? 'Select exporter first'
                    : marksAndNumbersLoading
                      ? 'Loading marks and numbers...'
                      : 'Select marks and numbers'
                }
                disabled={!values.exporterId || marksAndNumbersLoading || !marksAndNumbersOptions.length}
                wrapClass="sm:col-span-3"
              />
            </div>
            <Advanced title="Additional Details">
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <Select<ShippingBillFormValues>
                  label="Seal type"
                  name="sealType"
                  options={sealTypes}
                  placeholder={isBasicsLoading ? 'Loading...' : 'Select if relevant'}
                  disabled={isBasicsLoading}
                />
                {containersCount === 0 && (
                  <Input label="Number of containers" type="number" min={0} {...register('numberOfContainers')} />
                )}
                <Input label="Loose packets" type="number" min={0} {...register('loosePackets')} />
                <Input label="MAWB number" {...register('mawbNumber')} />
                <Input label="HAWB number" {...register('hawbNumber')} />
              </div>
            </Advanced>
          </div>
        </CardContent>
      </Card>
    </PersistentTab>
  )
}
