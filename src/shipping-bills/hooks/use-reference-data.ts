import { useQuery } from 'core/react-query'
import { referenceDataService, SchemeCodeOption } from '../services/reference-data-service'

export function useBasicsReferenceData() {
  const cargoQuery = useQuery({
    queryKey: ['ref', 'cargo'],
    queryFn: () => referenceDataService.getCargoOptions()
  })

  const sealQuery = useQuery({
    queryKey: ['ref', 'sealTypes'],
    queryFn: () => referenceDataService.getSealTypes()
  })

  const weightUnitQuery = useQuery({
    queryKey: ['ref', 'weightUnits'],
    queryFn: () => referenceDataService.getWeightUnits()
  })

  const statesQuery = useQuery({
    queryKey: ['ref', 'states'],
    queryFn: () => referenceDataService.getStateOptions()
  })

  const nfeiQuery = useQuery({
    queryKey: ['ref', 'nfei'],
    queryFn: () => referenceDataService.getNfeiCategories()
  })

  const dischargePortQuery = useQuery({
    queryKey: ['ref', 'dischargePorts'],
    queryFn: () => referenceDataService.getDischargePortOptions()
  })

  return {
    cargoOptions: cargoQuery.data ?? [],
    sealTypes: sealQuery.data ?? [],
    weightUnits: weightUnitQuery.data ?? [],
    stateOptions: statesQuery.data ?? [],
    nfeiCategoryOptions: nfeiQuery.data ?? [],
    dischargePortOptions: dischargePortQuery.data ?? [],
    isLoading:
      cargoQuery.isLoading ||
      sealQuery.isLoading ||
      weightUnitQuery.isLoading ||
      statesQuery.isLoading ||
      nfeiQuery.isLoading ||
      dischargePortQuery.isLoading,
    isError:
      cargoQuery.isError ||
      sealQuery.isError ||
      weightUnitQuery.isError ||
      statesQuery.isError ||
      nfeiQuery.isError ||
      dischargePortQuery.isError
  }
}

export function useInvoiceReferenceData() {
  const currencyQuery = useQuery({
    queryKey: ['ref', 'currencies'],
    queryFn: () => referenceDataService.getCurrencyOptions()
  })

  const contractQuery = useQuery({
    queryKey: ['ref', 'contractTypes'],
    queryFn: () => referenceDataService.getContractTypes()
  })

  const paymentQuery = useQuery({
    queryKey: ['ref', 'paymentTypes'],
    queryFn: () => referenceDataService.getPaymentTypes()
  })

  const priceInclusionQuery = useQuery({
    queryKey: ['ref', 'priceInclusions'],
    queryFn: () => referenceDataService.getPriceInclusionTypes()
  })

  return {
    currencyOptions: currencyQuery.data ?? [],
    contractTypes: contractQuery.data ?? [],
    paymentTypes: paymentQuery.data ?? [],
    priceInclusionTypes: priceInclusionQuery.data ?? [],
    isLoading:
      currencyQuery.isLoading || contractQuery.isLoading || paymentQuery.isLoading || priceInclusionQuery.isLoading,
    isError: currencyQuery.isError || contractQuery.isError || paymentQuery.isError || priceInclusionQuery.isError
  }
}

export function useItemReferenceData() {
  const schemeQuery = useQuery({
    queryKey: ['ref', 'schemes'],
    queryFn: () => referenceDataService.getSchemeCodes()
  })

  const quantityQuery = useQuery({
    queryKey: ['ref', 'quantities'],
    queryFn: () => referenceDataService.getQuantityCodes()
  })

  const tradeQuery = useQuery({
    queryKey: ['ref', 'tradeAgreements'],
    queryFn: () => referenceDataService.getTradeAgreements()
  })

  const accessoryQuery = useQuery({
    queryKey: ['ref', 'accessoryStatuses'],
    queryFn: () => referenceDataService.getAccessoryStatuses()
  })

  const igstQuery = useQuery({
    queryKey: ['ref', 'igstStatuses'],
    queryFn: () => referenceDataService.getIgstPaymentStatuses()
  })

  return {
    schemeCodes: (schemeQuery.data ?? []) as SchemeCodeOption[],
    quantityCodes: quantityQuery.data ?? [],
    tradeAgreements: tradeQuery.data ?? [],
    accessoryStatusOptions: accessoryQuery.data ?? [],
    igstPaymentStatusOptions: igstQuery.data ?? [],
    isLoading:
      schemeQuery.isLoading ||
      quantityQuery.isLoading ||
      tradeQuery.isLoading ||
      accessoryQuery.isLoading ||
      igstQuery.isLoading,
    isError:
      schemeQuery.isError || quantityQuery.isError || tradeQuery.isError || accessoryQuery.isError || igstQuery.isError
  }
}

export function useOthersReferenceData() {
  const containerSizeQuery = useQuery({
    queryKey: ['ref', 'containerSizes'],
    queryFn: () => referenceDataService.getContainerSizes()
  })

  const containerSealQuery = useQuery({
    queryKey: ['ref', 'containerSealTypes'],
    queryFn: () => referenceDataService.getContainerSealTypes()
  })

  const goodsSourceQuery = useQuery({
    queryKey: ['ref', 'goodsSources'],
    queryFn: () => referenceDataService.getGoodsSources()
  })

  const fileTypeQuery = useQuery({
    queryKey: ['ref', 'fileTypes'],
    queryFn: () => referenceDataService.getFileTypes()
  })

  return {
    containerSizeOptions: containerSizeQuery.data ?? [],
    containerSealTypes: containerSealQuery.data ?? [],
    goodsSourceOptions: goodsSourceQuery.data ?? [],
    fileTypeOptions: fileTypeQuery.data ?? [],
    isLoading:
      containerSizeQuery.isLoading ||
      containerSealQuery.isLoading ||
      goodsSourceQuery.isLoading ||
      fileTypeQuery.isLoading,
    isError:
      containerSizeQuery.isError || containerSealQuery.isError || goodsSourceQuery.isError || fileTypeQuery.isError
  }
}
