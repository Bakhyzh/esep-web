/** Pill switch for one currency; a group of toggle buttons, so it works with Tab + Enter/Space. */
export function CurrencyPills({ label, options, value, onChange }:
  { label: string; options: readonly string[]; value: string; onChange: (currency: string) => void }) {
  return (
    <div className="pills" role="group" aria-label={label}>
      {options.map(currency => (
        <button key={currency} type="button" className="pill" aria-pressed={currency === value} onClick={() => onChange(currency)}>
          {currency}
        </button>
      ))}
    </div>
  )
}
