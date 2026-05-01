import { Check, ChevronDown } from "lucide-react"
import React, { useEffect, useId, useMemo, useRef, useState } from "react"

type Labels = Record<string, string>

type SelectProps = {
  label: string
  value: string
  options: string[]
  labels?: Labels
  onChange: (value: string) => void
  className?: string
  searchable?: boolean
  searchPlaceholder?: string
}

const buttonClass = "inline-flex h-11 w-full items-center justify-between gap-3 rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 shadow-sm outline-none transition hover:border-slate-300 hover:bg-slate-50 focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/20"
const menuClass = "absolute left-0 top-full z-40 mt-2 max-h-72 min-w-full overflow-auto rounded-lg border border-slate-200 bg-white p-1 shadow-xl ring-1 ring-slate-900/5"

export function SingleSelectFilter({ label, value, options, labels = {}, onChange, className = "" }: SelectProps) {
  const [open, setOpen] = useState(false)
  const rootRef = useDropdownClose(() => setOpen(false))
  const id = useId()
  const selectedLabel = value ? labels[value] || value : `${label}: Any`

  return (
    <div ref={rootRef} className={`relative min-w-0 ${className}`}>
      <button
        id={id}
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        className={buttonClass}
        onClick={() => setOpen(current => !current)}
      >
        <span className="min-w-0 truncate">{selectedLabel}</span>
        <ChevronDown size={17} className={`shrink-0 text-slate-500 transition ${open ? "rotate-180" : ""}`} aria-hidden="true" />
      </button>
      {open && (
        <div role="listbox" aria-labelledby={id} className={menuClass}>
          <SelectOption
            label={`${label}: Any`}
            selected={!value}
            onClick={() => {
              onChange("")
              setOpen(false)
            }}
          />
          {options.filter(Boolean).map(option => (
            <SelectOption
              key={option}
              label={labels[option] || option}
              selected={value === option}
              onClick={() => {
                onChange(option)
                setOpen(false)
              }}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export function MultiSelectFilter({ label, value, options, labels = {}, onChange, className = "", searchable = false, searchPlaceholder }: SelectProps) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState("")
  const rootRef = useDropdownClose(() => setOpen(false))
  const id = useId()
  const selected = useMemo(() => splitFilterValue(value), [value])
  const selectedSet = useMemo(() => new Set(selected), [selected])
  const visibleOptions = useMemo(() => {
    const normalized = query.trim().toLowerCase()
    if (!normalized) return options
    return options.filter(option => `${labels[option] || option} ${option}`.toLowerCase().includes(normalized))
  }, [labels, options, query])
  const selectedLabel = selected.length === 0
    ? `${label}: Any`
    : selected.length === 1
      ? `${label}: ${labels[selected[0]] || selected[0]}`
      : `${label}: ${selected.length} selected`

  useEffect(() => {
    if (!open) setQuery("")
  }, [open])

  function toggle(option: string) {
    const next = selectedSet.has(option)
      ? selected.filter(item => item !== option)
      : [...selected, option]
    onChange(next.join(","))
  }

  return (
    <div ref={rootRef} className={`relative min-w-0 ${className}`}>
      <button
        id={id}
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        className={buttonClass}
        onClick={() => setOpen(current => !current)}
      >
        <span className="min-w-0 truncate">{selectedLabel}</span>
        <ChevronDown size={17} className={`shrink-0 text-slate-500 transition ${open ? "rotate-180" : ""}`} aria-hidden="true" />
      </button>
      {open && (
        <div role="menu" aria-labelledby={id} className={menuClass}>
          {searchable && (
            <div className="p-2">
              <label>
                <span className="sr-only">Search {label}</span>
                <input
                  className="h-9 w-full rounded-md border border-slate-200 px-3 text-sm font-medium text-slate-700 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                  value={query}
                  onChange={event => setQuery(event.target.value)}
                  placeholder={searchPlaceholder || `Search ${label.toLowerCase()}`}
                />
              </label>
            </div>
          )}
          <button
            type="button"
            className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm font-semibold text-slate-600 hover:bg-slate-50"
            onClick={() => onChange("")}
          >
            <span className="grid h-4 w-4 place-items-center rounded border border-slate-300 bg-white">
              {selected.length === 0 && <Check size={13} className="text-primary" aria-hidden="true" />}
            </span>
            {label}: Any
          </button>
          <div className="my-1 border-t border-slate-100" />
          {visibleOptions.filter(Boolean).map(option => {
            const checked = selectedSet.has(option)
            return (
              <button
                key={option}
                type="button"
                role="menuitemcheckbox"
                aria-checked={checked}
                className={`flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm font-semibold transition ${checked ? "bg-primary/10 text-primary" : "text-slate-700 hover:bg-slate-50"}`}
                onClick={() => toggle(option)}
              >
                <span className={`grid h-4 w-4 place-items-center rounded border ${checked ? "border-primary bg-primary text-white" : "border-slate-300 bg-white"}`}>
                  {checked && <Check size={13} aria-hidden="true" />}
                </span>
                <span className="min-w-0 truncate">{labels[option] || option}</span>
              </button>
            )
          })}
          {visibleOptions.filter(Boolean).length === 0 && (
            <div className="px-3 py-2 text-sm font-medium text-slate-400">No matches</div>
          )}
        </div>
      )}
    </div>
  )
}

function SelectOption({ label, selected, onClick }: { label: string; selected: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      role="option"
      aria-selected={selected}
      className={`flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm font-semibold transition ${selected ? "bg-primary text-white" : "text-slate-700 hover:bg-slate-50"}`}
      onClick={onClick}
    >
      <span className="grid h-4 w-4 place-items-center">
        {selected && <Check size={14} aria-hidden="true" />}
      </span>
      <span className="min-w-0 truncate">{label}</span>
    </button>
  )
}

function splitFilterValue(value: string) {
  return value.split(",").map(item => item.trim()).filter(Boolean)
}

function useDropdownClose(onClose: () => void) {
  const ref = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    function onPointerDown(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) onClose()
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose()
    }
    document.addEventListener("mousedown", onPointerDown)
    document.addEventListener("keydown", onKeyDown)
    return () => {
      document.removeEventListener("mousedown", onPointerDown)
      document.removeEventListener("keydown", onKeyDown)
    }
  }, [onClose])

  return ref
}
