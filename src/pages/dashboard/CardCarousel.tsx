import { ChevronLeft, ChevronRight, Plus } from 'lucide-react'
import { m } from 'motion/react'
import { useRef, type ReactNode } from 'react'
import type { Account } from '../../api/types'
import { BankCard } from '../../components/BankCard'
import { SectionHead } from '../../components/States'
import { cascade, useMotionDisabled } from '../../lib/motion'

interface CardCarouselProps {
  accounts: Account[]
  busy: boolean
  onNew: () => void
  onTopUp: (account: Account) => void
  onTransfer: (account: Account) => void
  onClose: (account: Account) => void
  /** extra header buttons (Refresh) */
  tools: ReactNode
}

/** Horizontal scroll-snap row of cards; arrow buttons for mouse users, swipe on touch, Tab moves through cards. */
export function CardCarousel({ accounts, busy, onNew, tools, ...actions }: CardCarouselProps) {
  const track = useRef<HTMLDivElement>(null)
  const noMotion = useMotionDisabled()

  function scroll(direction: 1 | -1) {
    const element = track.current!
    const step = element.querySelector<HTMLElement>('.carousel-item')?.offsetWidth ?? 300
    element.scrollBy({ left: direction * (step + 16), behavior: noMotion ? 'auto' : 'smooth' })
  }

  return (
    <div className="carousel-wrap">
      <SectionHead id="accounts-title" title="Accounts">
        <div className="head-tools">
          {tools}
          <div className="carousel-arrows">
            <button type="button" className="icon-button" aria-label="Scroll accounts left" onClick={() => scroll(-1)}><ChevronLeft /></button>
            <button type="button" className="icon-button" aria-label="Scroll accounts right" onClick={() => scroll(1)}><ChevronRight /></button>
          </div>
        </div>
      </SectionHead>
      <m.div ref={track} className="carousel" variants={cascade.container}
             initial={noMotion ? false : 'hidden'} animate="show">
        {accounts.map(account => (
          <m.div key={account.id} className="carousel-item" variants={cascade.item}>
            <BankCard account={account} busy={busy} {...actions} />
          </m.div>
        ))}
        <m.div className="carousel-item" variants={cascade.item}>
          <button type="button" className="new-card" onClick={onNew}>
            <span className="new-card-icon" aria-hidden="true"><Plus /></span>
            New account
          </button>
        </m.div>
      </m.div>
    </div>
  )
}
