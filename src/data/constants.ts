export interface SelectOption {
  value: string
  label: string
}

export const CURRENCY_OPTIONS: SelectOption[] = [
  { value: 'USD', label: 'USD - US Dollar' },
  { value: 'EUR', label: 'EUR - Euro' },
  { value: 'INR', label: 'INR - Indian Rupee' },
  { value: 'AED', label: 'AED - UAE Dirham' },
  { value: 'GBP', label: 'GBP - British Pound' },
  { value: 'SGD', label: 'SGD - Singapore Dollar' }
]

export const NFEI_CATEGORY_OPTIONS: SelectOption[] = [
  { value: '01', label: '01 - Free trade sample' },
  { value: '02', label: '02 - Diplomatic goods' },
  { value: '03', label: '03 - Warranty replacement' },
  { value: '07', label: '07 - Gift parcel' },
  { value: '08', label: '08 - Other' }
]

export const ACCESSORY_STATUS_OPTIONS: SelectOption[] = [
  { value: '0', label: 'No accessory' },
  { value: '1', label: 'Included free of cost' },
  { value: '2', label: 'Entered separately' }
]

export const IGST_PAYMENT_STATUS_OPTIONS: SelectOption[] = [
  { value: 'P', label: 'Payment of IGST with claim of rebate (P)' },
  { value: 'LUT', label: 'Under Undertaking / LUT (LUT)' },
  { value: '2', label: 'LUT / Bond (2)' },
  { value: '3', label: 'Without payment of IGST (3)' }
]

export const GOODS_SOURCE_OPTIONS: SelectOption[] = [
  { value: 'I', label: 'Imported' },
  { value: 'D', label: 'Indigenous' }
]

export const CONTAINER_SIZE_OPTIONS: SelectOption[] = [
  { value: '20', label: '20 Feet Standard' },
  { value: '40', label: '40 Feet Standard' },
  { value: '45', label: '45 Feet High Cube' }
]

export const FILE_TYPE_OPTIONS: SelectOption[] = [
  { value: '1', label: 'PDF Document (.pdf)' },
  { value: '2', label: 'JPEG Image (.jpg, .jpeg)' }
]

export const DEFAULT_CURRENCY = 'USD'
export const DEFAULT_UOM = 'PCS'
export const DEFAULT_WEIGHT_UNIT = 'KG'
export const DEFAULT_CONTRACT_TYPE = 'FOB'
export const DEFAULT_CARGO_NATURE = 'P'
