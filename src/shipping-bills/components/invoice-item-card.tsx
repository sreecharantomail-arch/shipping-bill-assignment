import { useItemReferenceData } from '@/shipping-bills/hooks/use-reference-data'
import { BillInvoiceForm, BillItemForm, Business, lineTotal, ShippingBillFormValues } from '@/shipping-bills/model'
import { Button } from 'ui/basic/button'
import { Checkbox } from 'ui/inputs/checkbox'
import { Input } from 'ui/inputs/input'
import { Select } from 'ui/inputs/select'
import { Advanced } from './common-sections'
import { BillFormContext, BranchPath, PartyFields } from './party-fields'

const dateType = 'date' as 'text'

export interface InvoiceItemCardProps {
  formCtx: BillFormContext
  invoiceIndex: number
  itemIndex: number
  invoice: BillInvoiceForm
  item: BillItemForm
  businesses: Business[]
  canRemove: boolean
  onRemove: () => void
  onQuickAdd: (role: 'buyer' | 'thirdParty' | 'itemThirdParty', invoiceIndex: number, itemIndex?: number) => void
  onAddBranch: (ownerId: number, branchName: BranchPath) => void
}

export function InvoiceItemCard({
  formCtx,
  invoiceIndex,
  itemIndex,
  invoice,
  item,
  businesses,
  canRemove,
  onRemove,
  onQuickAdd,
  onAddBranch
}: InvoiceItemCardProps) {
  const { register } = formCtx.hooks
  const {
    schemeCodes,
    quantityCodes,
    tradeAgreements,
    accessoryStatusOptions,
    igstPaymentStatusOptions,
    isLoading: isItemRefLoading
  } = useItemReferenceData()

  const selectedScheme = schemeCodes.find((s) => s.value === item.schemeCode)
  const showDrawback = Boolean(
    selectedScheme &&
    (selectedScheme.drawback === true || selectedScheme.RODTEP === true || selectedScheme.ROSCTL === true)
  )

  // BUG FIX: Correct the invoice item index used for the Unit of rate placeholder
  // Previously accessed invoice.items[invoiceIndex].unitOfMeasurement, which crashed or referenced wrong item
  const resolvedUnitOfRatePlaceholder = item.unitOfMeasurement || invoice.items[itemIndex]?.unitOfMeasurement || 'PCS'

  const thirdPartyParties = businesses.filter(
    (business) => business.isThirdParty || business.id === Number(item.itemThirdPartyId)
  )

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-xs">
      <div className="mb-3 flex items-center justify-between">
        <h4 className="text-sm font-semibold text-gray-900">Item {itemIndex + 1}</h4>
        {canRemove && (
          <Button size="sm" variant="ghost" className="text-rose-600 hover:bg-rose-50" onClick={onRemove}>
            Remove
          </Button>
        )}
      </div>
      <div className="mb-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-6">
        <Input
          label="RITC / HS code"
          {...register(`invoices.${invoiceIndex}.items.${itemIndex}.ritcCode`)}
          placeholder="e.g. 61091000"
        />
        <Select<ShippingBillFormValues>
          label="Scheme code"
          name={`invoices.${invoiceIndex}.items.${itemIndex}.schemeCode`}
          options={schemeCodes}
          placeholder={isItemRefLoading ? 'Loading schemes...' : 'Select scheme'}
          disabled={isItemRefLoading}
        />
        <Input
          label="Goods description"
          {...register(`invoices.${invoiceIndex}.items.${itemIndex}.goodsDescription1`)}
          wrapClass="lg:col-span-4"
          placeholder="e.g. Cotton T-shirts"
        />
        <Input
          label="Quantity"
          type="number"
          min={0}
          {...register(`invoices.${invoiceIndex}.items.${itemIndex}.quantity`)}
        />
        <Select<ShippingBillFormValues>
          label="Unit"
          name={`invoices.${invoiceIndex}.items.${itemIndex}.unitOfMeasurement`}
          options={quantityCodes}
          placeholder={isItemRefLoading ? '...' : undefined}
          disabled={isItemRefLoading}
          rules={{ required: true }}
        />
        <Input
          label={`Unit price (${invoice.currency || 'USD'})`}
          type="number"
          min={0}
          {...register(`invoices.${invoiceIndex}.items.${itemIndex}.unitPrice`)}
        />
        <Input
          label="Item Total"
          type="number"
          placeholder={`${invoice.currency || 'USD'} ${lineTotal(item).toLocaleString(undefined, { maximumFractionDigits: 2 })}`}
          {...register(`invoices.${invoiceIndex}.items.${itemIndex}.lineTotal`)}
        />
        <Select<ShippingBillFormValues>
          label="IGST payment"
          name={`invoices.${invoiceIndex}.items.${itemIndex}.igstPaymentStatus`}
          options={igstPaymentStatusOptions}
          placeholder={isItemRefLoading ? 'Loading...' : 'Select if applicable'}
          disabled={isItemRefLoading}
        />
      </div>

      {/* Row: drawback inputs (conditional) + checkboxes */}
      <div className="mb-3 flex flex-wrap items-end gap-4">
        {showDrawback && (
          <>
            <div className="w-36">
              <Input
                label="Drawback Serial no."
                {...register(`invoices.${invoiceIndex}.items.${itemIndex}.drawbackSerialNumber`)}
              />
            </div>
            <div className="w-32">
              <Input label="Drawback Unit" {...register(`invoices.${invoiceIndex}.items.${itemIndex}.drawbackUnit`)} />
            </div>
            <div className="w-36">
              <Input
                label="Drawback Quantity"
                type="number"
                {...register(`invoices.${invoiceIndex}.items.${itemIndex}.drawbackQuantity`)}
              />
            </div>
          </>
        )}
        <label className="flex items-center gap-2 pb-1 text-sm text-gray-700">
          <Checkbox {...register(`invoices.${invoiceIndex}.items.${itemIndex}.rewardItem`)} />
          Claim reward
        </label>
        <label className="flex items-center gap-2 pb-1 text-sm text-gray-700">
          <Checkbox {...register(`invoices.${invoiceIndex}.items.${itemIndex}.thirdPartyItem`)} />
          Third-party item
        </label>
      </div>

      {item.thirdPartyItem && (
        <div className="my-4 rounded-lg bg-gray-50 p-3">
          <PartyFields
            formCtx={formCtx}
            ownerName={`invoices.${invoiceIndex}.items.${itemIndex}.itemThirdPartyId`}
            branchName={`invoices.${invoiceIndex}.items.${itemIndex}.itemThirdPartyBranchId`}
            label="Item third party"
            kind="business"
            parties={thirdPartyParties}
            required={false}
            onQuickAdd={() => onQuickAdd('itemThirdParty', invoiceIndex, itemIndex)}
            onAddBranch={(ownerId) =>
              onAddBranch(ownerId, `invoices.${invoiceIndex}.items.${itemIndex}.itemThirdPartyBranchId`)
            }
          />
        </div>
      )}

      <Advanced title="Item customs, taxes and incentives">
        <div className="mb-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Select<ShippingBillFormValues>
            label="Unit of rate"
            {...register(`invoices.${invoiceIndex}.items.${itemIndex}.unitOfRate`)}
            options={quantityCodes}
            placeholder={resolvedUnitOfRatePlaceholder}
            disabled={isItemRefLoading}
          />
          <Input
            label="Per Unit (Rate)"
            type="number"
            placeholder="1"
            {...register(`invoices.${invoiceIndex}.items.${itemIndex}.numberOfUnits`)}
          />
          <Input
            label="Present market value"
            type="number"
            {...register(`invoices.${invoiceIndex}.items.${itemIndex}.presentMarketValue`)}
          />
          <Input label="GCess" type="number" {...register(`invoices.${invoiceIndex}.items.${itemIndex}.cess`)} />
          <Input
            label="Accessories description"
            wrapClass="lg:col-span-3"
            {...register(`invoices.${invoiceIndex}.items.${itemIndex}.accessoriesDescription`)}
          />
          <Select<ShippingBillFormValues>
            label="Accessory status"
            name={`invoices.${invoiceIndex}.items.${itemIndex}.accessoryStatus`}
            options={accessoryStatusOptions}
            placeholder={isItemRefLoading ? 'Loading...' : 'Select if relevant'}
            disabled={isItemRefLoading}
          />
          {item.igstPaymentStatus === 'P' && (
            <>
              <Input
                label="Taxable value"
                type="number"
                {...register(`invoices.${invoiceIndex}.items.${itemIndex}.taxableValue`)}
              />
              <Input
                label="IGST amount"
                type="number"
                {...register(`invoices.${invoiceIndex}.items.${itemIndex}.igstAmount`)}
              />
            </>
          )}

          <Input
            label="Origin district code"
            {...register(`invoices.${invoiceIndex}.items.${itemIndex}.originDistrictCode`)}
          />
          <Select<ShippingBillFormValues>
            label="Trade agreement code"
            name={`invoices.${invoiceIndex}.items.${itemIndex}.tradeAgreementsCode`}
            options={tradeAgreements}
            placeholder="NCPTI"
            disabled={isItemRefLoading}
          />
          <Input label="End use code" {...register(`invoices.${invoiceIndex}.items.${itemIndex}.endUseOfItem`)} />
          <Input
            label="Packages for item"
            type="number"
            {...register(`invoices.${invoiceIndex}.items.${itemIndex}.totalPackage`)}
          />
        </div>
        <Advanced title="AR4 / excise details">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Input label="AR4 number" {...register(`invoices.${invoiceIndex}.items.${itemIndex}.ar4Number`)} />
            <Input
              label="AR4 date"
              type={dateType}
              {...register(`invoices.${invoiceIndex}.items.${itemIndex}.ar4Date`)}
            />
          </div>
        </Advanced>
      </Advanced>
    </div>
  )
}
