import { ArrowUpRight, Mail, MapPin, Send } from 'lucide-react'
import { m } from 'motion/react'
import type { ReactNode } from 'react'
import { CONTACTS } from './contacts'
import { reveal, stagger } from './motion'

const STACK = ['Java', 'Spring Boot', 'PostgreSQL', 'Kafka', 'Redis', 'Docker', 'React', 'TypeScript']

const PROJECTS = [
  { name: 'Esep', tag: 'Fintech', text: 'Wallets and transfers on a double-entry ledger, spending analytics. Spring Boot API and this React app.',
    stack: ['Spring Boot', 'Kafka', 'Redis', 'React'], code: 'https://github.com/Bakhyzh/esep-api', live: 'https://bakhyzh.github.io/esep-web/' },
  { name: 'Post Hub', tag: 'Microservices', text: 'A blog platform split into services: API gateway, identity and access with JWT, shared utilities.',
    stack: ['Spring Cloud', 'JWT', 'PostgreSQL'], code: 'https://github.com/Bakhyzh/gateway-service-post-hub' },
  { name: 'BridgeAPI', tag: 'Integration', text: 'Aggregates several external APIs behind one clean, consistent interface.',
    stack: ['Spring Boot', 'REST'], code: 'https://github.com/Bakhyzh/BridgeAPI' },
  { name: 'Profit Calculator', tag: 'E-commerce', text: 'Calculates the real profit of marketplace sellers per product.',
    stack: ['Java', 'Web'], code: 'https://github.com/Bakhyzh/Profit-Calculator', live: 'https://profit-calculator-murex.vercel.app' },
  { name: 'entPlatform', tag: 'Backend', text: 'Spring Boot backend with PostgreSQL, JWT authentication and role-based access.',
    stack: ['Spring Security', 'PostgreSQL'], code: 'https://github.com/Bakhyzh/entPlatform' },
]

const SERVICES = [
  'REST APIs and backends on Java / Spring Boot',
  'Web apps in React + TypeScript, like this one',
  'Payments, ledgers, auth and integrations with external APIs',
  'Docker, CI/CD and deployment',
]

type Initial = false | 'hidden'

function Reveal({ children, className, initial }: { children: ReactNode; className: string; initial: Initial }) {
  return (
    <m.div className={className} variants={stagger} initial={initial} whileInView="show" viewport={{ once: true, amount: 0.15 }}>
      {children}
    </m.div>
  )
}

/** "About the author": photo, short bio, stack and links. */
export function AboutAuthor({ initial }: { initial: Initial }) {
  return (
    <section id="about" className="intro-section" aria-labelledby="about-title">
      <Reveal className="author" initial={initial}>
        <m.div className="author-photo" variants={reveal}>
          <img src="https://github.com/Bakhyzh.png?size=320" alt="Bakhyt Zharkynbek" width="160" height="160" loading="lazy" />
        </m.div>
        <div className="author-body">
          <m.p className="eyebrow" variants={reveal}>About the author</m.p>
          <m.h2 id="about-title" variants={reveal}>Bakhyt Zharkynbek</m.h2>
          <m.p className="author-role" variants={reveal}>
            Java Backend Developer
            <span className="muted"><MapPin className="icon" aria-hidden="true" />Almaty, Kazakhstan</span>
          </m.p>
          <m.p className="intro-lead" variants={reveal}>
            I build backends and web apps end to end: APIs and microservices on Spring Boot, data in PostgreSQL,
            events in Kafka and frontends in React. I care about correctness: tests, idempotency and clean data models.
            Esep is one of my projects.
          </m.p>
          <m.ul className="author-stack" variants={reveal} aria-label="Stack">
            {STACK.map(item => <li key={item}>{item}</li>)}
          </m.ul>
          <m.div className="author-links" variants={reveal}>
            <a className="social" href={CONTACTS.linkedin} target="_blank" rel="noreferrer"><LinkedInIcon />LinkedIn</a>
            <a className="social" href={CONTACTS.github} target="_blank" rel="noreferrer"><GitHubIcon />GitHub</a>
            <a className="social" href={CONTACTS.telegram} target="_blank" rel="noreferrer"><Send className="icon" aria-hidden="true" />Telegram</a>
            <a className="social" href={`mailto:${CONTACTS.email}`}><Mail className="icon" aria-hidden="true" />Email</a>
          </m.div>
        </div>
      </Reveal>
    </section>
  )
}

export function Projects({ initial }: { initial: Initial }) {
  return (
    <section id="projects" className="intro-section" aria-labelledby="projects-title">
      <Reveal className="intro-head" initial={initial}>
        <m.p className="eyebrow" variants={reveal}>Portfolio</m.p>
        <m.h2 id="projects-title" variants={reveal}>Other projects</m.h2>
      </Reveal>
      <Reveal className="projects" initial={initial}>
        {PROJECTS.map(project => (
          <m.article key={project.name} className="project" variants={reveal}>
            <div className="project-top">
              <span className="project-tag">{project.tag}</span>
              {project.live && <span className="project-live"><span className="dot" />Live</span>}
            </div>
            <h3>{project.name}</h3>
            <p>{project.text}</p>
            <ul className="project-stack">{project.stack.map(item => <li key={item}>{item}</li>)}</ul>
            <div className="project-links">
              <a href={project.code} target="_blank" rel="noreferrer"><GitHubIcon />Code</a>
              {project.live && (
                <a href={project.live} target="_blank" rel="noreferrer">Open<ArrowUpRight className="icon" aria-hidden="true" /></a>
              )}
            </div>
          </m.article>
        ))}
      </Reveal>
    </section>
  )
}

/** Freelance offer: what I build and how to reach me. */
export function HireMe({ initial }: { initial: Initial }) {
  return (
    <section id="hire" className="intro-section" aria-labelledby="hire-title">
      <Reveal className="hire" initial={initial}>
        <div className="hire-copy">
          <m.p className="eyebrow" variants={reveal}>Available for projects</m.p>
          <m.h2 id="hire-title" variants={reveal}>Need a project like this?</m.h2>
          <m.p className="intro-lead" variants={reveal}>
            I take on custom development, from an MVP to a production-ready system. Tell me about your idea and
            I will reply with a plan, a timeline and an estimate.
          </m.p>
          <m.div className="intro-ctas" variants={reveal}>
            <a className="button-link big" href={CONTACTS.telegram} target="_blank" rel="noreferrer">
              <Send className="icon" aria-hidden="true" />Message on Telegram
            </a>
            <a className="button-link ghost big" href={`mailto:${CONTACTS.email}?subject=${encodeURIComponent('Project request')}`}>
              <Mail className="icon" aria-hidden="true" />Send an email
            </a>
          </m.div>
        </div>
        <m.ul className="hire-list" variants={stagger}>
          {SERVICES.map((service, i) => (
            <m.li key={service} variants={reveal}><span>{String(i + 1).padStart(2, '0')}</span>{service}</m.li>
          ))}
        </m.ul>
      </Reveal>
    </section>
  )
}

// brand marks are not in lucide: simple inline paths
export function LinkedInIcon() {
  return (
    <svg className="icon" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" focusable="false">
      <path d="M20.45 20.45h-3.55v-5.57c0-1.33-.03-3.04-1.85-3.04-1.86 0-2.14 1.45-2.14 2.94v5.67H9.36V9h3.41v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28ZM5.34 7.43a2.06 2.06 0 1 1 0-4.12 2.06 2.06 0 0 1 0 4.12ZM7.12 20.45H3.56V9h3.56v11.45ZM22.23 0H1.77C.79 0 0 .77 0 1.73v20.54C0 23.23.79 24 1.77 24h20.46c.98 0 1.77-.77 1.77-1.73V1.73C24 .77 23.21 0 22.23 0Z" />
    </svg>
  )
}

export function GitHubIcon() {
  return (
    <svg className="icon" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" focusable="false">
      <path d="M12 .3a12 12 0 0 0-3.8 23.38c.6.12.83-.26.83-.57v-2.23c-3.34.73-4.04-1.42-4.04-1.42-.55-1.39-1.33-1.76-1.33-1.76-1.09-.74.08-.73.08-.73 1.2.09 1.84 1.24 1.84 1.24 1.07 1.83 2.8 1.3 3.49 1 .1-.78.42-1.31.76-1.61-2.67-.3-5.47-1.33-5.47-5.93 0-1.31.47-2.38 1.24-3.22-.13-.3-.54-1.52.12-3.18 0 0 1-.32 3.3 1.23a11.5 11.5 0 0 1 6 0c2.28-1.55 3.29-1.23 3.29-1.23.66 1.66.25 2.88.12 3.18a4.65 4.65 0 0 1 1.23 3.22c0 4.61-2.8 5.63-5.48 5.92.43.37.81 1.1.81 2.22v3.29c0 .32.22.7.83.57A12 12 0 0 0 12 .3" />
    </svg>
  )
}
