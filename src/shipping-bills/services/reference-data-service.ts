import {
  ACCESSORY_STATUS_OPTIONS,
  CONTAINER_SIZE_OPTIONS,
  CURRENCY_OPTIONS,
  DEFAULT_CARGO_NATURE,
  DEFAULT_CONTRACT_TYPE,
  DEFAULT_CURRENCY,
  DEFAULT_UOM,
  DEFAULT_WEIGHT_UNIT,
  FILE_TYPE_OPTIONS,
  GOODS_SOURCE_OPTIONS,
  IGST_PAYMENT_STATUS_OPTIONS,
  NFEI_CATEGORY_OPTIONS
} from '@/data/constants'
import { documentCodes } from '@/data/e-sanchit-codes'
import {
  allPorts,
  dischargePortOptions,
  getPortByCode as getRawPortByCode,
  loadingPorts,
  PortOption,
  ports
} from '@/data/ports'
import { quantityCodes } from '@/data/quantity-code'
import rawSchemeCodes from '@/data/scheme-codes'
import { stateOptions } from '@/data/states'
import { Trades } from '@/data/trade-agrements'
import { cargoOptions, contractTypes, paymentTypes, priceInclusionTypes, sealTypes, weightUnits } from '@/data/types'
import { isSimulatingFailure } from '../shipping-bill-service'

const DEFAULT_DELAY_MS = 60

function delay<T>(value: T, ms = DEFAULT_DELAY_MS): Promise<T> {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (isSimulatingFailure()) {
        reject(new Error('Simulated network error: Failed to fetch reference options from server.'))
      } else {
        resolve(value)
      }
    }, ms)
  })
}

export interface SelectOption<T = string | number> {
  value: T
  label: string
  [key: string]: any
}

export interface SchemeCodeOption extends SelectOption<string> {
  drawback?: boolean
  RODTEP?: boolean
  ROSCTL?: boolean
}

/**
 * Asynchronous, Promise-based Reference Data Service.
 * Provides a clean API boundary for all reference options, constants, and lookup tables,
 * decoupling UI components from hardcoded arrays and enabling trivial replacement with real HTTP endpoints.
 */
export const referenceDataService = {
  // Currency options
  async getCurrencyOptions(): Promise<SelectOption[]> {
    return delay([...CURRENCY_OPTIONS])
  },

  // Port options
  async getLoadingPorts(): Promise<PortOption[]> {
    return delay([...loadingPorts])
  },

  async getDischargePortOptions(): Promise<SelectOption[]> {
    return delay([...dischargePortOptions])
  },

  async getDestinationPorts(): Promise<PortOption[]> {
    return delay([...ports])
  },

  async searchPorts(query: string, options?: { onlyLoading?: boolean }): Promise<PortOption[]> {
    const list = options?.onlyLoading ? loadingPorts : allPorts
    const q = query.trim().toLowerCase()
    if (!q) return delay([...list])
    const filtered = list.filter(
      (p) =>
        p.name.toLowerCase().includes(q) || p.code.toLowerCase().includes(q) || p.countryCode.toLowerCase().includes(q)
    )
    return delay(filtered)
  },

  async getPortByCode(code?: string): Promise<PortOption | undefined> {
    return delay(getRawPortByCode(code), 20)
  },

  // State options
  async getStateOptions(): Promise<SelectOption[]> {
    return delay([...stateOptions])
  },

  // Cargo, Seal & Weight
  async getCargoOptions(): Promise<SelectOption[]> {
    return delay([...cargoOptions])
  },

  async getSealTypes(): Promise<SelectOption[]> {
    return delay([...sealTypes])
  },

  async getWeightUnits(): Promise<SelectOption[]> {
    return delay([...weightUnits])
  },

  // Regulatory & NFEI
  async getNfeiCategories(): Promise<SelectOption[]> {
    return delay([...NFEI_CATEGORY_OPTIONS])
  },

  // Invoice terms & payments
  async getContractTypes(): Promise<SelectOption[]> {
    return delay([...contractTypes])
  },

  async getPaymentTypes(): Promise<SelectOption[]> {
    return delay([...paymentTypes])
  },

  async getPriceInclusionTypes(): Promise<SelectOption[]> {
    return delay([...priceInclusionTypes])
  },

  // Items & Schemes
  async getQuantityCodes(): Promise<SelectOption[]> {
    return delay([...quantityCodes])
  },

  async getSchemeCodes(): Promise<SchemeCodeOption[]> {
    return delay([...rawSchemeCodes])
  },

  async getSchemeByCode(code?: string): Promise<SchemeCodeOption | undefined> {
    const found = rawSchemeCodes.find((s) => s.value === code)
    return delay(found, 20)
  },

  async getTradeAgreements(): Promise<SelectOption[]> {
    return delay([...Trades])
  },

  async getAccessoryStatuses(): Promise<SelectOption[]> {
    return delay([...ACCESSORY_STATUS_OPTIONS])
  },

  async getIgstPaymentStatuses(): Promise<SelectOption[]> {
    return delay([...IGST_PAYMENT_STATUS_OPTIONS])
  },

  // Containers & Packaging
  async getContainerSizes(): Promise<SelectOption[]> {
    return delay([...CONTAINER_SIZE_OPTIONS])
  },

  async getContainerSealTypes(): Promise<SelectOption[]> {
    return delay([
      { value: '1', label: 'BTSL - Bottle Seal' },
      { value: '2', label: 'ESEAL - Electronic Seal' },
      { value: '3', label: 'RFID - Radio Frequency Identifier' }
    ])
  },

  async getGoodsSources(): Promise<SelectOption[]> {
    return delay([...GOODS_SOURCE_OPTIONS])
  },

  // E-Sanchit Documents
  async getAllDocumentCodes(): Promise<SelectOption<string>[]> {
    return delay([...documentCodes])
  },

  async searchDocumentCodes(query: string): Promise<SelectOption<string>[]> {
    const q = query.trim().toLowerCase()
    if (!q) return delay(documentCodes.slice(0, 50))
    const filtered = documentCodes.filter(
      (doc) => doc.label.toLowerCase().includes(q) || doc.value.toLowerCase().includes(q)
    )
    return delay(filtered.slice(0, 50))
  },

  async getDocumentByCode(code?: string): Promise<SelectOption<string> | undefined> {
    if (!code) return delay(undefined, 10)
    const found = documentCodes.find((doc) => doc.value === code || doc.label === code)
    return delay(found, 20)
  },

  async getFileTypes(): Promise<SelectOption[]> {
    return delay([...FILE_TYPE_OPTIONS])
  },

  // Defaults
  defaults: {
    currency: DEFAULT_CURRENCY,
    uom: DEFAULT_UOM,
    weightUnit: DEFAULT_WEIGHT_UNIT,
    contractType: DEFAULT_CONTRACT_TYPE,
    cargoNature: DEFAULT_CARGO_NATURE
  }
}
