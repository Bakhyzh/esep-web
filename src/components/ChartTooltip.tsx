interface Item { name?: string | number; value?: unknown; color?: string }

interface ChartTooltipProps {
  active?: boolean
  label?: string | number
  payload?: readonly Item[]
  formatLabel: (label: string) => string
  formatValue: (value: number) => string
}

/** Values in text colors; the colored swatch alone carries series identity. */
export function ChartTooltip({ active, label, payload, formatLabel, formatValue }: ChartTooltipProps) {
  if (!active || !payload?.length) {
    return null
  }
  return (
    <div className="chart-tooltip">
      <div className="muted">{formatLabel(String(label))}</div>
      {payload.map(item => (
        <div key={String(item.name)} className="row-item">
          <span className="swatch" style={{ background: item.color }} />
          <span>{item.name}: <strong>{formatValue(Number(item.value))}</strong></span>
        </div>
      ))}
    </div>
  )
}
