import { ArrowRight, ArrowLeftRight, BookOpenCheck, ChartColumn, KeyRound, ShieldCheck, WalletCards } from 'lucide-react'
import { m, useInView, useScroll, useSpring } from 'motion/react'
import { Fragment, useRef, type PointerEvent, type ReactNode } from 'react'
import { Link } from 'react-router'
import { useAuth } from '../auth/useAuth'
import { Logo } from '../components/Brand'
import { motionDisabled, useMotionDisabled } from '../lib/motion'
import { useCountUp } from '../lib/useCountUp'
import '../styles/intro.css'
import { AboutAuthor, GitHubIcon, HireMe, LinkedInIcon, Projects } from './intro/Author'
import { CONTACTS } from './intro/contacts'
import { EASE, reveal, stagger } from './intro/motion'


const FEATURES = [
  { icon: WalletCards, title: 'Multi-currency wallets', text: 'Open accounts in KZT, USD and EUR. Balances are never mixed across currencies.' },
  { icon: ArrowLeftRight, title: 'Instant transfers', text: 'Send money to any account number in a few taps, with a clear confirmation step.' },
  { icon: BookOpenCheck, title: 'Double-entry ledger', text: 'Every transfer is a debit and a credit that sum to zero. Money never appears or disappears.' },
  { icon: ChartColumn, title: 'Spending analytics', text: 'Daily, weekly and monthly spending, moving averages and your largest transfers.' },
  { icon: KeyRound, title: 'Idempotent by design', text: 'Each transfer carries an Idempotency-Key, so a retry after a network error never pays twice.' },
  { icon: ShieldCheck, title: 'Secure sessions', text: 'JWT authentication, rate limiting and an audit trail of every operation.' },
]

const STEPS = [
  { title: 'Create an account', text: 'Register with your email in under a minute.' },
  { title: 'Open a wallet', text: 'Pick a currency and get your Esep card instantly.' },
  { title: 'Send and track', text: 'Transfer money and watch your spending in charts.' },
]

const TICKER = ['Double-entry ledger', 'KZT · USD · EUR', 'Idempotent transfers', 'Spending analytics', 'Real-time notifications', 'JWT auth', 'Rate limiting']

/** Public landing page at "/": what Esep is, with links to sign in or register. */
export function IntroPage() {
  const { token } = useAuth()
  const noMotion = useMotionDisabled()
  const { scrollYProgress } = useScroll()
  const progress = useSpring(scrollYProgress, { stiffness: 140, damping: 30, restDelta: 0.001 })
  const initial = noMotion ? false : 'hidden'

  // scroll by script: with HashRouter an href="#features" would be read as a route
  const scrollTo = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: motionDisabled() ? 'auto' : 'smooth' })

  return (
    <div className="intro">
      <m.div className="intro-progress" style={{ scaleX: progress }} aria-hidden="true" />
      <div className="intro-bg" aria-hidden="true"><i /><i /><i /></div>

      <header className="intro-nav">
        <Link to="/" className="brand"><Logo />Esep</Link>
        <nav aria-label="Sections">
          <button type="button" className="link" onClick={() => scrollTo('features')}>Features</button>
          <button type="button" className="link" onClick={() => scrollTo('ledger')}>How it works</button>
          <button type="button" className="link" onClick={() => scrollTo('about')}>About</button>
          <button type="button" className="link" onClick={() => scrollTo('hire')}>Hire me</button>
        </nav>
        <div className="intro-nav-actions">
          {token ? (
            <Link to="/accounts" className="button-link">Open app</Link>
          ) : (
            <>
              <Link to="/login" className="button-link ghost">Sign in</Link>
              <Link to="/register" className="button-link">Get started</Link>
            </>
          )}
        </div>
      </header>

      <main>
        <section className="intro-hero" aria-labelledby="intro-title">
          <m.div className="intro-hero-copy" variants={stagger} initial={initial} animate="show">
            <m.p className="intro-badge" variants={reveal}><span className="dot" />Wallets · Transfers · Analytics</m.p>
            <h1 id="intro-title">
              <HeadlineWords text="Money that" noMotion={noMotion} delay={0.15} />{' '}
              <span className="gradient-text"><HeadlineWords text="always adds up." noMotion={noMotion} delay={0.4} /></span>
            </h1>
            <m.p className="intro-lead" variants={reveal}>
              Esep keeps your wallets in KZT, USD and EUR, sends money in seconds and shows where it goes.
              Every tenge is accounted for on a double-entry ledger.
            </m.p>
            <m.div className="intro-ctas" variants={reveal}>
              <Link to={token ? '/accounts' : '/register'} className="button-link big">
                {token ? 'Open dashboard' : 'Create free account'}<ArrowRight className="icon" aria-hidden="true" />
              </Link>
              {!token && <Link to="/login" className="button-link ghost big">I have an account</Link>}
            </m.div>
            <m.p className="intro-demo muted" variants={reveal}>
              Try it: <code>alice@esep.dev</code> / <code>password123</code>
            </m.p>
          </m.div>
          <HeroCards noMotion={noMotion} />
        </section>

        <div className="intro-ticker" aria-hidden="true">
          <div className="intro-ticker-track">
            {[...TICKER, ...TICKER].map((item, i) => <span key={i}>{item}<i>✦</i></span>)}
          </div>
        </div>

        <Section id="stats" className="intro-stats" initial={initial}>
          <Stat value={3} label="currencies" suffix="" />
          <Stat value={2} label="ledger entries per transfer" suffix="" />
          <Stat value={0} label="duplicate payments on retry" suffix="" />
          <Stat value={100} label="of balances derived from the ledger" suffix="%" />
        </Section>

        <section id="features" className="intro-section" aria-labelledby="features-title">
          <SectionHead id="features-title" eyebrow="Features" title="Everything a wallet needs" initial={initial}>
            Built like a real bank backend, wrapped in an interface that feels like an app.
          </SectionHead>
          <Section className="intro-features" initial={initial}>
            {FEATURES.map(({ icon: Icon, title, text }) => (
              <m.article key={title} className="intro-feature" variants={reveal} onPointerMove={spotlight}>
                <span className="intro-feature-icon"><Icon aria-hidden="true" /></span>
                <h3>{title}</h3>
                <p>{text}</p>
              </m.article>
            ))}
          </Section>
        </section>

        <section id="ledger" className="intro-section intro-split" aria-labelledby="ledger-title">
          <SectionHead id="ledger-title" eyebrow="How it works" title="Two entries. Zero surprises." initial={initial}>
            When Alice sends Bob 5 000 ₸, Esep writes a debit on her account and a credit on his, in one
            transaction. The entries always sum to zero, so balances can be rebuilt from history at any time.
          </SectionHead>
          <LedgerDemo initial={initial} />
        </section>

        <section className="intro-section" aria-labelledby="steps-title">
          <SectionHead id="steps-title" eyebrow="Get started" title="Up and running in three steps" initial={initial} center />
          <Steps initial={initial} />
        </section>

        <Section className="intro-final" initial={initial}>
          <m.h2 variants={reveal}>Ready to try Esep?</m.h2>
          <m.p variants={reveal}>Create an account and make your first transfer in a minute.</m.p>
          <m.div className="intro-ctas" variants={reveal}>
            <Link to={token ? '/accounts' : '/register'} className="button-link big inverse">
              {token ? 'Open dashboard' : 'Get started'}<ArrowRight className="icon" aria-hidden="true" />
            </Link>
          </m.div>
        </Section>

        <AboutAuthor initial={initial} />
        <Projects initial={initial} />
        <HireMe initial={initial} />
      </main>

      <footer className="intro-footer">
        <span className="brand"><Logo />Esep</span>
        <span className="muted">Made by Bakhyt Zharkynbek · React · Spring Boot · PostgreSQL · Kafka</span>
        <span className="intro-footer-links">
          <a href={CONTACTS.linkedin} target="_blank" rel="noreferrer" aria-label="LinkedIn"><LinkedInIcon /></a>
          <a href={CONTACTS.github} target="_blank" rel="noreferrer" aria-label="GitHub"><GitHubIcon /></a>
          <a href={CONTACTS.telegram} target="_blank" rel="noreferrer">@bakhyzh</a>
        </span>
      </footer>
    </div>
  )
}

/** Words slide up from a mask one after another. */
function HeadlineWords({ text, noMotion, delay }: { text: string; noMotion: boolean; delay: number }) {
  // the space stays outside the mask: inside an inline-block it would collapse
  return text.split(' ').map((word, i, words) => (
    <Fragment key={i}>
      <span className="word-mask">
        <m.span className="word" initial={noMotion ? false : { y: '110%' }} animate={{ y: 0 }}
                transition={{ duration: 0.7, ease: EASE, delay: delay + i * 0.08 }}>
          {word}
        </m.span>
      </span>
      {i < words.length - 1 && ' '}
    </Fragment>
  ))
}

/** Three floating bank cards that lean after the mouse (decorative). */
function HeroCards({ noMotion }: { noMotion: boolean }) {
  const scene = useRef<HTMLDivElement>(null)
  function onMove(event: PointerEvent) {
    if (event.pointerType !== 'mouse' || motionDisabled()) return
    const box = scene.current!.getBoundingClientRect()
    scene.current!.style.setProperty('--mx', String((event.clientX - box.left) / box.width - 0.5))
    scene.current!.style.setProperty('--my', String((event.clientY - box.top) / box.height - 0.5))
  }
  function onLeave() {
    scene.current?.style.setProperty('--mx', '0')
    scene.current?.style.setProperty('--my', '0')
  }
  const cards = [
    { theme: 'graphite', currency: '€', name: 'EUR', amount: '€1 240.00', id: '0007' },
    { theme: 'navy', currency: '$', name: 'USD', amount: '$3 580.50', id: '0042' },
    { theme: 'brand', currency: '₸', name: 'KZT', amount: '485 000 ₸', id: '0118' },
  ]
  return (
    <div className="hero-scene" ref={scene} onPointerMove={onMove} onPointerLeave={onLeave} aria-hidden="true">
      {cards.map((card, i) => (
        <m.div key={card.id} className={`hero-card hero-card-${i}`} data-theme={card.theme}
               initial={noMotion ? false : { opacity: 0, y: 80, rotate: -12 }} animate={{ opacity: 1, y: 0, rotate: 0 }}
               transition={{ duration: 0.9, ease: EASE, delay: 0.3 + i * 0.15 }}>
          <div className="hero-card-face">
            <div className="hero-card-row"><span>Esep · {card.name}</span><span className="chip">{card.currency}</span></div>
            <div className="hero-card-amount">{card.amount}</div>
            <div className="hero-card-row small"><span>ESEP •••• {card.id}</span><span>Active</span></div>
          </div>
        </m.div>
      ))}
      <m.div className="hero-toast hero-toast-1" initial={noMotion ? false : { opacity: 0, scale: 0.6 }}
             animate={{ opacity: 1, scale: 1 }} transition={{ delay: 1.2, type: 'spring', stiffness: 260, damping: 18 }}>
        <span className="in">+</span>25 000 ₸ received
      </m.div>
      <m.div className="hero-toast hero-toast-2" initial={noMotion ? false : { opacity: 0, scale: 0.6 }}
             animate={{ opacity: 1, scale: 1 }} transition={{ delay: 1.5, type: 'spring', stiffness: 260, damping: 18 }}>
        <span className="ok">✓</span>Transfer sent
      </m.div>
    </div>
  )
}

/** A block whose children cascade in when it scrolls into view. */
function Section({ children, className, id, initial }: { children: ReactNode; className?: string; id?: string; initial: false | 'hidden' }) {
  return (
    <m.div id={id} className={className} variants={stagger} initial={initial} whileInView="show"
           viewport={{ once: true, amount: 0.2 }}>
      {children}
    </m.div>
  )
}

function SectionHead({ id, eyebrow, title, children, initial, center }:
  { id: string; eyebrow: string; title: string; children?: ReactNode; initial: false | 'hidden'; center?: boolean }) {
  return (
    <Section className={center ? 'intro-head center' : 'intro-head'} initial={initial}>
      <m.p className="eyebrow" variants={reveal}>{eyebrow}</m.p>
      <m.h2 id={id} variants={reveal}>{title}</m.h2>
      {children && <m.p className="intro-lead" variants={reveal}>{children}</m.p>}
    </Section>
  )
}

function Stat({ value, label, suffix }: { value: number; label: string; suffix: string }) {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, amount: 0.6 })
  return (
    <m.div className="intro-stat" ref={ref} variants={reveal}>
      {/* the count-up starts when the number is mounted, i.e. once it is on screen */}
      {inView ? <CountUp value={value} suffix={suffix} /> : <span className="intro-stat-value">0{suffix}</span>}
      <span className="intro-stat-label">{label}</span>
    </m.div>
  )
}

function CountUp({ value, suffix }: { value: number; suffix: string }) {
  const ref = useCountUp<HTMLSpanElement>(value, v => `${Math.round(v)}${suffix}`)
  return <span className="intro-stat-value" ref={ref} />
}

/** Alice -> Bob: a coin travels between the accounts, then the two ledger entries appear. */
function LedgerDemo({ initial }: { initial: false | 'hidden' }) {
  return (
    <Section className="ledger-demo" initial={initial}>
      <m.div className="ledger-flow" variants={reveal}>
        <div className="ledger-party"><span className="avatar">A</span>Alice<small>KZT •••• 0118</small></div>
        <div className="ledger-wire"><span className="ledger-coin">₸</span></div>
        <div className="ledger-party"><span className="avatar b">B</span>Bob<small>KZT •••• 0042</small></div>
      </m.div>
      <m.table className="ledger-table" variants={reveal}>
        <thead><tr><th>Account</th><th>Entry</th><th className="num">Amount</th></tr></thead>
        <tbody>
          <m.tr variants={reveal}><td>Alice · 0118</td><td>Debit</td><td className="num amount-out">5 000 ₸</td></m.tr>
          <m.tr variants={reveal}><td>Bob · 0042</td><td>Credit</td><td className="num amount-in">5 000 ₸</td></m.tr>
        </tbody>
        <tfoot><tr><td colSpan={2}>Sum of entries</td><td className="num">0 ₸</td></tr></tfoot>
      </m.table>
    </Section>
  )
}

/** Three numbered steps; the line between them draws itself as the section scrolls by. */
function Steps({ initial }: { initial: false | 'hidden' }) {
  const ref = useRef<HTMLOListElement>(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start 85%', 'end 60%'] })
  return (
    <m.ol className="intro-steps" ref={ref} variants={stagger} initial={initial} whileInView="show" viewport={{ once: true, amount: 0.3 }}>
      <m.span className="intro-steps-line" style={{ scaleX: scrollYProgress }} aria-hidden="true" />
      {STEPS.map((step, i) => (
        <m.li key={step.title} variants={reveal}>
          <span className="intro-step-num">{i + 1}</span>
          <h3>{step.title}</h3>
          <p>{step.text}</p>
        </m.li>
      ))}
    </m.ol>
  )
}

/** Feature cards: a soft light follows the mouse (CSS reads --sx/--sy). */
function spotlight(event: PointerEvent<HTMLElement>) {
  const box = event.currentTarget.getBoundingClientRect()
  event.currentTarget.style.setProperty('--sx', `${event.clientX - box.left}px`)
  event.currentTarget.style.setProperty('--sy', `${event.clientY - box.top}px`)
}
