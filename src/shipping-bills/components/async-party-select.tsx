import { RrCaretDown } from 'icons/rr/fi-rr-caret-down'
import React, { useEffect, useId, useRef, useState } from 'react'
import { getFormContext, RegisterOptions, useController } from 'ui/form'
import { Input } from 'ui/inputs/input'
import { Popover, PopoverContent, PopoverTrigger } from 'ui/interactive/popover'
import { PopoverContext } from 'ui/interactive/popover-context'
import { clsx, getContext } from 'ui/utils'

export interface AsyncOption {
  value: string
  label: string
  sublabel?: string
}

export interface AsyncPartySelectProps {
  name: string
  placeholder?: string
  disabled?: boolean
  className?: string
  rules?: RegisterOptions
  deps?: React.DependencyList
  fetchOptions: (query: string) => Promise<AsyncOption[]>
  getInitialLabel?: (id: string) => Promise<string>
  control?: any
  setValue?: (name: any, val: any, opt?: any) => void
}

export function PopoverOptionItem({
  option,
  isSelected,
  onSelect
}: {
  option: AsyncOption
  isSelected: boolean
  onSelect: (opt: AsyncOption) => void
}) {
  const { setOpen } = getContext(PopoverContext)

  const handleSelect = () => {
    onSelect(option)
    setOpen(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      handleSelect()
    }
  }

  return (
    <div
      role="option"
      aria-selected={isSelected}
      tabIndex={0}
      onClick={handleSelect}
      onKeyDown={handleKeyDown}
      className={clsx(
        'focus:ring-primary-500 flex cursor-pointer flex-col rounded p-2 text-sm transition-colors focus:ring-2 focus:outline-none',
        isSelected ? 'bg-primary-50 text-primary-900 font-semibold' : 'text-gray-950 hover:bg-gray-100'
      )}>
      <span>{option.label}</span>
      {option.sublabel && <span className="text-xs text-gray-500">{option.sublabel}</span>}
    </div>
  )
}

export function AsyncPartySelect({
  name,
  placeholder = 'Search...',
  disabled = false,
  className,
  rules,
  deps = [],
  fetchOptions,
  getInitialLabel,
  control,
  setValue
}: AsyncPartySelectProps) {
  const ctx = getFormContext()
  const effectiveControl = control || ctx?.hooks?.control
  const effectiveSetValue = setValue || ctx?.hooks?.setValue
  const {
    field: { value, onChange, onBlur }
  } = useController({ name, rules, control: effectiveControl })

  const [query, setQuery] = useState('')
  const [options, setOptions] = useState<AsyncOption[]>([])
  const [loading, setLoading] = useState(false)
  const [hasError, setHasError] = useState(false)
  const [selectedLabel, setSelectedLabel] = useState('')
  const searchInputRef = useRef<HTMLInputElement>(null)
  const listboxId = useId()

  // Resolve initial label from ID
  useEffect(() => {
    let active = true
    if (value != null && String(value).trim() !== '') {
      if (getInitialLabel) {
        getInitialLabel(String(value))
          .then((lbl) => {
            if (active && lbl) setSelectedLabel(lbl)
          })
          .catch(() => {
            if (active) setSelectedLabel(String(value))
          })
      } else {
        const found = options.find((opt) => opt.value === String(value))
        if (found) setSelectedLabel(found.label)
        else setSelectedLabel(String(value))
      }
    } else {
      setSelectedLabel('')
    }
    return () => {
      active = false
    }
  }, [value, getInitialLabel, ...deps])

  // Search options with debounce & error resilience
  useEffect(() => {
    let active = true
    setLoading(true)
    setHasError(false)

    const timer = setTimeout(() => {
      fetchOptions(query)
        .then((res) => {
          if (active) {
            setOptions(res || [])
            setLoading(false)
          }
        })
        .catch((err) => {
          if (active) {
            console.warn('Async option fetch error:', err)
            setHasError(true)
            setOptions([])
            setLoading(false)
          }
        })
    }, 200)

    return () => {
      active = false
      clearTimeout(timer)
    }
  }, [query, ...deps])

  return (
    <div className={className ? clsx('relative', className) : 'relative'}>
      <Popover>
        <PopoverTrigger asChild>
          <div
            role="combobox"
            aria-expanded={false}
            aria-haspopup="listbox"
            aria-controls={listboxId}
            aria-disabled={disabled}
            className={clsx(
              'focus:ring-primary-500 flex h-10 w-full cursor-pointer items-center justify-between rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm transition-colors hover:border-gray-400 focus:ring-2 focus:outline-none',
              disabled ? 'cursor-not-allowed bg-gray-100 opacity-60' : undefined
            )}
            onClick={() => {
              if (!disabled) {
                setTimeout(() => searchInputRef.current?.focus(), 50)
              }
            }}>
            <span className={clsx('truncate', !selectedLabel ? 'text-gray-400' : undefined)}>
              {selectedLabel || placeholder}
            </span>
            <RrCaretDown className="size-4 shrink-0 text-gray-500" />
          </div>
        </PopoverTrigger>
        <PopoverContent className="w-[320px] p-2 shadow-lg">
          <div className="p-1">
            <Input
              ref={searchInputRef}
              placeholder="Type to filter..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="h-8 text-xs"
              aria-label="Filter options"
            />
          </div>
          <div
            id={listboxId}
            role="listbox"
            aria-label={placeholder}
            className="max-h-56 overflow-y-auto p-1"
            tabIndex={-1}>
            {loading ? (
              <div role="status" aria-live="polite" className="p-3 text-center text-xs text-gray-500">
                Searching options...
              </div>
            ) : hasError ? (
              <div role="alert" className="p-3 text-center text-xs text-rose-500">
                Failed to load options. Try typing again.
              </div>
            ) : options.length === 0 ? (
              <div role="status" className="p-3 text-center text-xs text-gray-400">
                No matching results found
              </div>
            ) : (
              options.map((opt) => (
                <PopoverOptionItem
                  key={opt.value}
                  option={opt}
                  isSelected={String(value) === opt.value}
                  onSelect={(selected) => {
                    onChange(selected.value)
                    if (effectiveSetValue) {
                      effectiveSetValue(name, selected.value, {
                        shouldValidate: true,
                        shouldDirty: true,
                        shouldTouch: true
                      })
                    }
                    setSelectedLabel(selected.label)
                    setQuery('')
                    onBlur()
                  }}
                />
              ))
            )}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  )
}
