import { useInvoiceReferenceData } from '@/shipping-bills/hooks/use-reference-data'
import { BillInvoiceForm, Business, emptyItem, invoiceTotal, ShippingBillFormValues } from '@/shipping-bills/model'
import { useFieldArray } from 'core/form'
import { Button } from 'ui/basic/button'
import { Card, CardContent, CardHeader } from 'ui/basic/card'
import { Checkbox } from 'ui/inputs/checkbox'
import { Input } from 'ui/inputs/input'
import { Select } from 'ui/inputs/select'
import { SectionHeading } from './common-sections'
import { InvoiceItemCard } from './invoice-item-card'
import { BillFormContext, BranchPath, PartyFields } from './party-fields'

const dateType = 'date' as 'text'

export interface InvoiceCardProps {
  formCtx: BillFormContext
  index: number
  invoice: BillInvoiceForm
  businesses: Business[]
  canRemove: boolean
  onRemove: () => void
  onQuickAdd: (role: 'buyer' | 'thirdParty' | 'itemThirdParty', invoiceIndex: number, itemIndex?: number) => void
  onAddBranch: (ownerId: number, branchName: BranchPath) => void
}

export function InvoiceCard({
  formCtx,
  index,
  invoice,
  businesses,
  canRemove,
  onRemove,
  onQuickAdd,
  onAddBranch
}: InvoiceCardProps) {
  const { register, control, watch } = formCtx.hooks
  const invoiceValues = watch(`invoices.${index}`)
  const {
    fields: items,
    append: addItem,
    remove: removeItem
  } = useFieldArray({ control, name: `invoices.${index}.items` })

  const {
    currencyOptions,
    contractTypes,
    paymentTypes,
    priceInclusionTypes,
    isLoading: isRefLoading
  } = useInvoiceReferenceData()

  const buyerSame = watch(`invoices.${index}.buyerSameAsConsignee`)
  const buyerOptions = businesses.filter((business) => business.isBuyer || business.id === Number(invoice.buyerId))
  const thirdPartyOptions = businesses.filter(
    (business) => business.isThirdParty || business.id === Number(invoice.thirdPartyId)
  )

  return (
    <Card className="mb-4">
      <CardHeader className="flex-row items-start justify-between gap-3">
        <div>
          <h3 className="font-semibold text-gray-950">Invoice {index + 1}</h3>
        </div>
        {canRemove && (
          <Button size="sm" variant="ghost" className="text-rose-600 hover:bg-rose-50" onClick={onRemove}>
            Remove invoice
          </Button>
        )}
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Input label="Invoice number" {...register(`invoices.${index}.invoiceNumber`)} />
          <Input label="Invoice date" type={dateType} {...register(`invoices.${index}.invoiceDate`)} />
          <div className="flex gap-2">
            <div className="w-[110px] shrink-0">
              <Select<ShippingBillFormValues>
                label="Currency"
                name={`invoices.${index}.currency`}
                options={currencyOptions}
                placeholder={isRefLoading ? '...' : undefined}
                disabled={isRefLoading}
                rules={{ required: true }}
              />
            </div>
            <div className="flex-1">
              <Input
                label="Total"
                type="number"
                min={0}
                {...register(`invoices.${index}.invoiceTotal`)}
                placeholder="0.00"
              />
            </div>
          </div>
          <Select<ShippingBillFormValues>
            label="Contract"
            name={`invoices.${index}.contractType`}
            options={contractTypes}
            placeholder={isRefLoading ? 'Loading...' : undefined}
            disabled={isRefLoading}
            rules={{ required: true }}
          />
        </div>

        <label className="flex items-center gap-2 text-sm text-gray-700">
          <Checkbox {...register(`invoices.${index}.buyerSameAsConsignee`)} />
          Buyer & consignee are same
        </label>

        {!buyerSame && (
          <PartyFields
            formCtx={formCtx}
            ownerName={`invoices.${index}.buyerId`}
            branchName={`invoices.${index}.buyerBranchId`}
            label="Buyer"
            kind="business"
            parties={buyerOptions}
            onQuickAdd={() => onQuickAdd('buyer', index)}
            onAddBranch={(ownerId) => onAddBranch(ownerId, `invoices.${index}.buyerBranchId`)}
          />
        )}

        <div className="space-y-4">
          <div className="divide-y divide-gray-100 rounded-lg border border-gray-200">
            <div className="grid grid-cols-1 divide-y divide-gray-100 lg:grid-cols-2 lg:divide-x lg:divide-y-0">
              <div className="p-2">
                <div className="flex flex-wrap items-center gap-2 lg:flex-nowrap">
                  <span className="w-28 shrink-0 font-medium text-gray-900">Freight</span>
                  <div className="flex items-center gap-1">
                    <Input
                      type="number"
                      {...register(`invoices.${index}.freightRate`)}
                      className="text-right"
                      disabled={invoiceValues.freightAmount !== '' && invoiceValues.freightAmount != null}
                      placeholder="Rate"
                    />
                    <span className="text-xs text-gray-500">%</span>
                  </div>
                  <Input
                    type="number"
                    {...register(`invoices.${index}.freightAmount`)}
                    className="py-1 text-right"
                    disabled={invoiceValues.freightRate !== '' && invoiceValues.freightRate != null}
                    placeholder="Amount"
                  />
                  <Select<ShippingBillFormValues>
                    name={`invoices.${index}.freightCurrency`}
                    options={currencyOptions}
                    placeholder={invoice.currency || 'USD'}
                    disabled={isRefLoading}
                  />
                </div>
              </div>
              <div className="p-2">
                <div className="flex flex-wrap items-center gap-2 lg:flex-nowrap">
                  <span className="w-28 shrink-0 font-medium text-gray-900">Insurance</span>
                  <div className="flex items-center gap-1">
                    <Input
                      type="number"
                      {...register(`invoices.${index}.insuranceRate`)}
                      className="text-right"
                      disabled={invoiceValues.insuranceAmount !== '' && invoiceValues.insuranceAmount != null}
                      placeholder="Rate"
                    />
                    <span className="text-xs text-gray-500">%</span>
                  </div>
                  <Input
                    type="number"
                    {...register(`invoices.${index}.insuranceAmount`)}
                    className="py-1 text-right"
                    disabled={invoiceValues.insuranceRate !== '' && invoiceValues.insuranceRate != null}
                    placeholder="Amount"
                  />
                  <Select<ShippingBillFormValues>
                    name={`invoices.${index}.insuranceCurrency`}
                    options={currencyOptions}
                    placeholder={invoice.currency || 'USD'}
                    disabled={isRefLoading}
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 divide-y divide-gray-100 lg:grid-cols-2 lg:divide-x lg:divide-y-0">
              <div className="p-2">
                <div className="flex flex-wrap items-center gap-2 lg:flex-nowrap">
                  <span className="w-28 shrink-0 font-medium text-gray-900">Commission</span>
                  <div className="flex items-center gap-1">
                    <Input
                      type="number"
                      {...register(`invoices.${index}.commissionRate`)}
                      className="text-right"
                      disabled={invoiceValues.commissionAmount !== '' && invoiceValues.commissionAmount != null}
                      placeholder="Rate"
                    />
                    <span className="text-xs text-gray-500">%</span>
                  </div>
                  <Input
                    type="number"
                    {...register(`invoices.${index}.commissionAmount`)}
                    className="py-1 text-right"
                    disabled={invoiceValues.commissionRate !== '' && invoiceValues.commissionRate != null}
                    placeholder="Amount"
                  />
                  <Select<ShippingBillFormValues>
                    name={`invoices.${index}.commissionCurrency`}
                    options={currencyOptions}
                    placeholder={invoice.currency || 'USD'}
                    disabled={isRefLoading}
                  />
                </div>
              </div>
              <div className="p-2">
                <div className="flex flex-wrap items-center gap-2 lg:flex-nowrap">
                  <span className="w-28 shrink-0 font-medium text-gray-900">Discount</span>
                  <div className="flex items-center gap-1">
                    <Input
                      type="number"
                      {...register(`invoices.${index}.discountRate`)}
                      className="text-right"
                      disabled={invoiceValues.discountAmount !== '' && invoiceValues.discountAmount != null}
                      placeholder="Rate"
                    />
                    <span className="text-xs text-gray-500">%</span>
                  </div>
                  <Input
                    type="number"
                    {...register(`invoices.${index}.discountAmount`)}
                    className="py-1 text-right"
                    disabled={invoiceValues.discountRate !== '' && invoiceValues.discountRate != null}
                    placeholder="Amount"
                  />
                  <Select<ShippingBillFormValues>
                    name={`invoices.${index}.discountCurrency`}
                    options={currencyOptions}
                    placeholder={invoice.currency || 'USD'}
                    disabled={isRefLoading}
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 divide-y divide-gray-100 lg:grid-cols-2 lg:divide-x lg:divide-y-0">
              <div className="p-2">
                <div className="flex flex-wrap items-center gap-2 lg:flex-nowrap">
                  <span className="w-28 shrink-0 font-medium text-gray-900">Other Deductions</span>
                  <div className="flex items-center gap-1">
                    <Input
                      type="number"
                      {...register(`invoices.${index}.otherDeductionsRate`)}
                      className="text-right"
                      disabled={
                        invoiceValues.otherDeductionsAmount !== '' && invoiceValues.otherDeductionsAmount != null
                      }
                      placeholder="Rate"
                    />
                    <span className="text-xs text-gray-500">%</span>
                  </div>
                  <Input
                    type="number"
                    {...register(`invoices.${index}.otherDeductionsAmount`)}
                    className="py-1 text-right"
                    disabled={invoiceValues.otherDeductionsRate !== '' && invoiceValues.otherDeductionsRate != null}
                    placeholder="Amount"
                  />
                  <Select<ShippingBillFormValues>
                    name={`invoices.${index}.otherDeductionsCurrency`}
                    options={currencyOptions}
                    placeholder={invoice.currency || 'USD'}
                    disabled={isRefLoading}
                  />
                </div>
              </div>
              <div className="p-2">
                <div className="flex flex-wrap items-center gap-2 lg:flex-nowrap">
                  <span className="w-28 shrink-0 font-medium text-gray-900">Packing Charges</span>
                  <Input
                    type="number"
                    {...register(`invoices.${index}.packingCharges`)}
                    className="py-1 text-right"
                    placeholder="Amount"
                  />
                  <span className="w-14 text-sm text-gray-500">—</span>
                </div>
              </div>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Select<ShippingBillFormValues>
              label="Price includes"
              name={`invoices.${index}.freightInsuranceIncluded`}
              options={priceInclusionTypes}
              placeholder={isRefLoading ? 'Loading...' : 'Select if applicable'}
              disabled={isRefLoading}
            />
            <Input label="Contract / order number" {...register(`invoices.${index}.contractNumber`)} />
            <Select<ShippingBillFormValues>
              label="Payment type"
              name={`invoices.${index}.natureOfPayment`}
              options={paymentTypes}
              placeholder={isRefLoading ? 'Loading...' : 'Select if applicable'}
              disabled={isRefLoading}
            />
            <Input label="Payment period (days)" type="number" {...register(`invoices.${index}.periodOfPayment`)} />
          </div>

          <PartyFields
            formCtx={formCtx}
            ownerName={`invoices.${index}.thirdPartyId`}
            branchName={`invoices.${index}.thirdPartyBranchId`}
            label="Third party (optional)"
            kind="business"
            parties={thirdPartyOptions}
            required={false}
            onQuickAdd={() => onQuickAdd('thirdParty', index)}
            onAddBranch={(ownerId) => onAddBranch(ownerId, `invoices.${index}.thirdPartyBranchId`)}
          />
        </div>

        <div className="border-t border-gray-200 pt-5">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <SectionHeading title="Goods" description="Line items included in this invoice." />
            <Button size="sm" variant="outline" onClick={() => addItem(emptyItem())}>
              + Add item
            </Button>
          </div>
          <div className="space-y-4">
            {items.map((field, itemIndex) => {
              const item = invoice.items[itemIndex] ?? emptyItem()
              return (
                <InvoiceItemCard
                  key={field.id}
                  formCtx={formCtx}
                  invoiceIndex={index}
                  itemIndex={itemIndex}
                  invoice={invoice}
                  item={item}
                  businesses={businesses}
                  canRemove={items.length > 1}
                  onRemove={() => removeItem(itemIndex)}
                  onQuickAdd={onQuickAdd}
                  onAddBranch={onAddBranch}
                />
              )
            })}
          </div>
        </div>

        <div className="text-right text-sm font-semibold text-gray-900">
          Invoice total: {invoice.currency || 'USD'}{' '}
          {invoiceTotal(invoice).toLocaleString(undefined, { maximumFractionDigits: 2 })}
        </div>
      </CardContent>
    </Card>
  )
}
