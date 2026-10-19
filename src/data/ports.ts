export interface PortOption {
  code: string
  name: string
  countryCode: string
}

export const loadingPorts: PortOption[] = [
  { code: 'INNSA1', name: 'Nhava Sheva (JNPT)', countryCode: 'IN' },
  { code: 'INMUN1', name: 'Mundra', countryCode: 'IN' },
  { code: 'INMAA1', name: 'Chennai', countryCode: 'IN' },
  { code: 'INBOM4', name: 'Mumbai Air Cargo', countryCode: 'IN' },
  { code: 'INCOK1', name: 'Cochin', countryCode: 'IN' },
  { code: 'INCCU1', name: 'Kolkata', countryCode: 'IN' }
]

export const foreignPorts: PortOption[] = [
  { code: 'KRBUS', name: 'Busan', countryCode: 'KR' },
  { code: 'USMSY', name: 'New Orleans', countryCode: 'US' },
  { code: 'USLAX', name: 'Los Angeles', countryCode: 'US' },
  { code: 'DEHAM', name: 'Hamburg', countryCode: 'DE' },
  { code: 'AEJEA', name: 'Jebel Ali', countryCode: 'AE' },
  { code: 'SGSIN', name: 'Singapore', countryCode: 'SG' },
  { code: 'GBLON', name: 'London Gateway', countryCode: 'GB' },
  { code: 'GBFXT', name: 'Felixstowe', countryCode: 'GB' },
  { code: 'NLRTM', name: 'Rotterdam', countryCode: 'NL' },
  { code: 'BEANR', name: 'Antwerp', countryCode: 'BE' },
  { code: 'JPTYO', name: 'Tokyo', countryCode: 'JP' }
]

// All distinct ports indexed by code to guarantee uniqueness
const portMap = new Map<string, PortOption>()
;[...loadingPorts, ...foreignPorts].forEach((port) => {
  if (!portMap.has(port.code)) {
    portMap.set(port.code, port)
  }
})

export const allPorts: PortOption[] = Array.from(portMap.values())

// Standard ports list (used for destination / discharge selection)
export const ports: PortOption[] = allPorts

export function getPortByCode(code?: string): PortOption | undefined {
  if (!code) return undefined
  return portMap.get(code.trim().toUpperCase())
}

export function portCountry(code?: string): string {
  if (!code) return ''
  const trimmed = code.trim().toUpperCase()
  const found = portMap.get(trimmed)
  if (found) return found.countryCode
  const match = trimmed.match(/^[A-Z]{2}/)
  return match ? match[0] : ''
}

export const portOptions = allPorts.map((port) => ({
  value: port.code,
  label: `${port.name} · ${port.code}`
}))

export const dischargePortOptions = allPorts.map((port) => ({
  value: port.code,
  label: `${port.name} (${port.countryCode}) · ${port.code}`
}))
