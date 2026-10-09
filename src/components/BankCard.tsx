import { ArrowUpRight, Plus, RotateCcw, X } from 'lucide-react'
import { useEffect, useRef, useState, type PointerEvent } from 'react'
import type { Account } from '../api/types'
import { cardTheme, currencySymbol, maskedNumber } from '../lib/cards'
import { formatMoney } from '../lib/format'
import { motionDisabled } from '../lib/motion'
import { useCountUp } from '../lib/useCountUp'

const formatDate = (iso: string) => new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' }).format(new Date(iso))

const canTilt = () => window.matchMedia('(hover: hover) and (pointer: fine)').matches && !motionDisabled()

interface BankCardProps {
  account: Account
  busy: boolean
  onTopUp: (account: Account) => void
  onTransfer: (account: Account) => void
  onClose: (account: Account) => void
}

/**
 * An account as a bank card. Front: name, currency, balance, masked number, status.
 * Click (or Enter) flips it to the back with details and actions. With a mouse the card tilts after the
 * cursor (±8°) and a glare follows it; all of that is transform/opacity only and is off for reduced motion.
 */
export function BankCard({ account, busy, onTopUp, onTransfer, onClose }: BankCardProps) {
  const [flipped, setFlipped] = useState(false)
  const userFlipped = useRef(false)
  const tilt = useRef<HTMLDivElement>(null)
  const rect = useRef<DOMRect | null>(null)
  const frame = useRef(0)
  const front = useRef<HTMLButtonElement>(null)
  const backFirst = useRef<HTMLButtonElement>(null)
  const money = (value: number) => formatMoney(value, account.currency)
  const balance = useCountUp<HTMLDivElement>(account.balance, money)
  const closed = account.status === 'CLOSED'
  const canClose = !closed && account.balance === 0

  useEffect(() => {
    if (!userFlipped.current) return
    // keep keyboard focus on the visible side
    ;(flipped ? backFirst.current : front.current)?.focus()
  }, [flipped])

  function flip(value: boolean) {
    userFlipped.current = true
    setFlipped(value)
  }

  function onPointerMove(event: PointerEvent) {
    if (event.pointerType !== 'mouse') return
    if (!rect.current) {
      if (!canTilt()) return
      rect.current = tilt.current!.getBoundingClientRect()   // read once per hover, not on every move
    }
    const box = rect.current
    const px = (event.clientX - box.left) / box.width
    const py = (event.clientY - box.top) / box.height
    cancelAnimationFrame(frame.current)
    frame.current = requestAnimationFrame(() => {
      const style = tilt.current!.style
      style.setProperty('--rx', `${((0.5 - py) * 16).toFixed(2)}deg`)
      style.setProperty('--ry', `${((px - 0.5) * 16).toFixed(2)}deg`)
      style.setProperty('--px', px.toFixed(3))
      style.setProperty('--py', py.toFixed(3))
      tilt.current!.classList.add('tilting')
    })
  }

  function onPointerLeave() {
    rect.current = null
    cancelAnimationFrame(frame.current)
    const element = tilt.current!
    element.classList.remove('tilting')
    element.style.setProperty('--rx', '0deg')
    element.style.setProperty('--ry', '0deg')
  }

  return (
    <article className={`account bank-card ${closed ? 'closed' : ''} ${flipped ? 'flipped' : ''}`}
             data-theme={cardTheme(account.currency)}>
      <div ref={tilt} className="tilt" onPointerMove={onPointerMove} onPointerLeave={onPointerLeave}>
        <div className="flipper">
          <button ref={front} type="button" className="card-face card-front" aria-expanded={flipped}
                  inert={flipped} onClick={() => flip(true)}>
            <span className="card-glare" aria-hidden="true" />
            <div className="meta">
              <span>Account #{account.id}</span>
              <span className="currency-chip" aria-hidden="true">{currencySymbol(account.currency)}</span>
            </div>
            <div className="balance" ref={balance} />
            <div className="card-foot">
              <span className="card-number">{maskedNumber(account.id)}</span>
              <span className="card-status">{account.status}</span>
            </div>
            {closed && <span className="closed-band" aria-hidden="true">CLOSED</span>}
            <span className="visually-hidden">Show account details</span>
          </button>

          <div className="card-face card-back" inert={!flipped}>
            <div className="back-head">
              <h3>Account #{account.id}</h3>
              <button ref={backFirst} type="button" className="icon-button" aria-label="Show card front" onClick={() => flip(false)}>
                <RotateCcw />
              </button>
            </div>
            <dl className="card-details">
              <div><dt>Account ID</dt><dd>{account.id}</dd></div>
              <div><dt>Currency</dt><dd>{account.currency}</dd></div>
              <div><dt>Opened</dt><dd>{formatDate(account.createdAt)}</dd></div>
            </dl>
            <div className="card-actions">
              <button type="button" disabled={closed} onClick={() => onTopUp(account)}><Plus aria-hidden="true" />Top up</button>
              <button type="button" disabled={closed} onClick={() => onTransfer(account)}><ArrowUpRight aria-hidden="true" />Transfer</button>
              <button type="button" aria-label="Close account" disabled={!canClose || busy} onClick={() => onClose(account)}
                      title={canClose ? 'Close account' : 'Only an active account with a zero balance can be closed'}>
                <X aria-hidden="true" />Close
              </button>
            </div>
          </div>
        </div>
      </div>
    </article>
  )
}
