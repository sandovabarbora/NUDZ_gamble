import { useEffect, useMemo, useState, type ReactNode, type SyntheticEvent } from 'react'

import {
  CATALOG_STRATEGY_IDS,
  activeStrategies,
  selectedStrategies,
  type CatalogStrategyId,
  type CopingStrategyRecord,
} from '@domain/coping.ts'
import { useTranslation, type TranslationKey } from '@ui/i18n/index.ts'
import { initialSelectedCatalogIds, useCopingStore } from '@ui/store/useCopingStore.ts'

type AppView = 'home' | 'coping' | 'overview' | 'profile'

const strategyIcon: Record<CatalogStrategyId, string> = {
  'walk-15': '↗',
  'call-close-person': '☎',
  'take-shower': '≈',
  'name-feeling': '✎',
  'go-running': '⌁',
}

function strategyKey(id: CatalogStrategyId, field: 'title' | 'summary' | 'why' | 'when') {
  return `strategy.${id}.${field}` as TranslationKey
}

export function App() {
  const load = useCopingStore((state) => state.load)
  const status = useCopingStore((state) => state.status)
  const completed = useCopingStore((state) => state.hasCompletedCopingOnboarding)
  const [introSeen, setIntroSeen] = useState(false)
  const [view, setView] = useState<AppView>('home')
  const { t } = useTranslation()

  useEffect(() => {
    void load()
  }, [load])

  if (status === 'idle' || status === 'loading') {
    return <div className="center-state">{t('app.loading')}</div>
  }

  if (!completed) {
    return introSeen ? (
      <CopingOnboarding
        onBack={() => {
          setIntroSeen(false)
        }}
      />
    ) : (
      <Intro
        onContinue={() => {
          setIntroSeen(true)
        }}
      />
    )
  }

  return (
    <AppShell view={view} onNavigate={setView}>
      {view === 'home' && (
        <Dashboard
          onOpenCoping={() => {
            setView('coping')
          }}
        />
      )}
      {view === 'coping' && <CopingSection />}
      {(view === 'overview' || view === 'profile') && <Placeholder />}
    </AppShell>
  )
}

function Intro({ onContinue }: { onContinue: () => void }) {
  const { t } = useTranslation()
  return (
    <main className="onboarding-shell">
      <section className="onboarding-page intro-page">
        <div className="brand-mark" aria-hidden="true">
          N
        </div>
        <div className="intro-copy">
          <p className="eyebrow">{t('intro.eyebrow')}</p>
          <h1>{t('intro.title')}</h1>
          <p className="lead">{t('intro.body')}</p>
          <ul className="benefit-list">
            {[t('intro.point1'), t('intro.point2'), t('intro.point3')].map((item) => (
              <li key={item}>
                <span aria-hidden="true">✓</span>
                {item}
              </li>
            ))}
          </ul>
          <aside className="disclaimer-card">
            <strong>{t('intro.disclaimerTitle')}</strong>
            <p>{t('intro.disclaimerBody')}</p>
          </aside>
        </div>
        <button className="primary-button" onClick={onContinue}>
          {t('intro.start')}
        </button>
      </section>
    </main>
  )
}

function CopingOnboarding({ onBack }: { onBack: () => void }) {
  const { t } = useTranslation()
  const complete = useCopingStore((state) => state.completeOnboarding)
  const status = useCopingStore((state) => state.status)
  const storeError = useCopingStore((state) => state.error)
  const [selected, setSelected] = useState<Set<CatalogStrategyId>>(
    () => new Set(initialSelectedCatalogIds),
  )
  const [customTitle, setCustomTitle] = useState('')
  const [customNote, setCustomNote] = useState('')
  const count = selected.size + (customTitle.trim() ? 1 : 0)

  function toggle(id: CatalogStrategyId) {
    setSelected((current) => {
      const next = new Set(current)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function submit(event: SyntheticEvent<HTMLFormElement>) {
    event.preventDefault()
    void complete({ selectedCatalogIds: [...selected], customTitle, customNote })
  }

  return (
    <main className="onboarding-shell">
      <form className="onboarding-page strategy-onboarding" onSubmit={submit}>
        <header className="onboarding-header">
          <button className="text-button" type="button" onClick={onBack}>
            ← {t('common.back')}
          </button>
          <span>{t('onboarding.eyebrow')}</span>
        </header>
        <div>
          <h1>{t('onboarding.title')}</h1>
          <p className="lead">{t('onboarding.body')}</p>
        </div>
        <div className="selection-list">
          {CATALOG_STRATEGY_IDS.map((id) => (
            <button
              className={`selection-row ${selected.has(id) ? 'is-selected' : ''}`}
              type="button"
              aria-pressed={selected.has(id)}
              key={id}
              onClick={() => {
                toggle(id)
              }}
            >
              <span className="strategy-symbol" aria-hidden="true">
                {strategyIcon[id]}
              </span>
              <span>{t(strategyKey(id, 'title'))}</span>
              <span className="check-mark" aria-hidden="true">
                {selected.has(id) ? '✓' : ''}
              </span>
            </button>
          ))}
        </div>
        <div className="field-stack">
          <label htmlFor="custom-title">{t('onboarding.customLabel')}</label>
          <input
            id="custom-title"
            maxLength={80}
            value={customTitle}
            placeholder={t('onboarding.customPlaceholder')}
            onChange={(event) => {
              setCustomTitle(event.target.value)
            }}
          />
          {customTitle.trim() && (
            <>
              <label htmlFor="custom-note">{t('onboarding.noteLabel')}</label>
              <input
                id="custom-note"
                maxLength={240}
                value={customNote}
                placeholder={t('onboarding.notePlaceholder')}
                onChange={(event) => {
                  setCustomNote(event.target.value)
                }}
              />
            </>
          )}
        </div>
        {storeError && (
          <p className="form-error">
            {storeError === 'selection-required'
              ? t('onboarding.selectionRequired')
              : t('coping.errorSave')}
          </p>
        )}
        <div className="sticky-action">
          <button className="primary-button" disabled={status === 'saving'}>
            {t('onboarding.finish')}
          </button>
          <p>{t('onboarding.count', { count })}</p>
        </div>
      </form>
    </main>
  )
}

function AppShell({
  view,
  onNavigate,
  children,
}: {
  view: AppView
  onNavigate: (view: AppView) => void
  children: ReactNode
}) {
  const { t } = useTranslation()
  const items: { id: AppView; icon: string; label: string }[] = [
    { id: 'home', icon: '⌂', label: t('nav.home') },
    { id: 'coping', icon: '◇', label: t('nav.coping') },
    { id: 'overview', icon: '▥', label: t('nav.overview') },
    { id: 'profile', icon: '○', label: t('nav.profile') },
  ]
  return (
    <div className="app-frame">
      <aside className="desktop-rail">
        <div className="rail-brand">
          <span>N</span>
          {t('app.title')}
        </div>
        <Navigation items={items} view={view} onNavigate={onNavigate} />
      </aside>
      <main className="main-content">{children}</main>
      <nav className="bottom-nav" aria-label={t('nav.label')}>
        <Navigation items={items} view={view} onNavigate={onNavigate} />
      </nav>
    </div>
  )
}

function Navigation({
  items,
  view,
  onNavigate,
}: {
  items: { id: AppView; icon: string; label: string }[]
  view: AppView
  onNavigate: (view: AppView) => void
}) {
  return (
    <>
      {items.map((item) => (
        <button
          key={item.id}
          className={view === item.id ? 'active' : ''}
          aria-current={view === item.id ? 'page' : undefined}
          onClick={() => {
            onNavigate(item.id)
          }}
        >
          <span aria-hidden="true">{item.icon}</span>
          <small>{item.label}</small>
        </button>
      ))}
    </>
  )
}

function Dashboard({ onOpenCoping }: { onOpenCoping: () => void }) {
  const { t } = useTranslation()
  const count = useCopingStore((state) => selectedStrategies(state.strategies).length)
  return (
    <div className="content-page">
      <header className="page-header">
        <p className="eyebrow">{t('dashboard.eyebrow')}</p>
        <h1>{t('dashboard.title')}</h1>
        <p className="lead">{t('dashboard.body')}</p>
      </header>
      <section className="metric-grid">
        <Metric
          title={t('dashboard.time')}
          value="245 / 336 min"
          remaining={t('dashboard.remaining', { value: '91 min' })}
          progress={73}
        />
        <Metric
          title={t('dashboard.money')}
          value="6 500 / 8 000 Kč"
          remaining={t('dashboard.remaining', { value: '1 500 Kč' })}
          progress={81}
          caution
        />
      </section>
      <section className="surface-card today-card">
        <div>
          <p className="eyebrow">{t('dashboard.today')}</p>
          <h2>{t('dashboard.todayBody')}</h2>
        </div>
        <button className="secondary-button">＋ {t('dashboard.add')}</button>
      </section>
      <section className="surface-card coping-promo">
        <span className="large-symbol" aria-hidden="true">
          ◇
        </span>
        <div>
          <h2>{t('dashboard.copingTitle')}</h2>
          <p>{t('dashboard.copingBody', { count })}</p>
        </div>
        <button className="link-button" onClick={onOpenCoping}>
          {t('dashboard.openCoping')} →
        </button>
      </section>
    </div>
  )
}

function Metric({
  title,
  value,
  remaining,
  progress,
  caution = false,
}: {
  title: string
  value: string
  remaining: string
  progress: number
  caution?: boolean
}) {
  return (
    <article className="surface-card metric-card">
      <div className="metric-top">
        <span>{title}</span>
        <span className={caution ? 'badge caution' : 'badge'}>{progress} %</span>
      </div>
      <strong>{value}</strong>
      <div className="progress-track">
        <span className={caution ? 'caution-bar' : ''} style={{ width: `${String(progress)}%` }} />
      </div>
      <small>{remaining}</small>
    </article>
  )
}

function CopingSection() {
  const { t } = useTranslation()
  const storedStrategies = useCopingStore((state) => state.strategies)
  const strategies = useMemo(() => activeStrategies(storedStrategies), [storedStrategies])
  const selected = useMemo(() => selectedStrategies(strategies), [strategies])
  const learningSteps: {
    number: string
    title: TranslationKey
    body: TranslationKey
  }[] = [
    { number: '01', title: 'coping.learn1Title', body: 'coping.learn1Body' },
    { number: '02', title: 'coping.learn2Title', body: 'coping.learn2Body' },
    { number: '03', title: 'coping.learn3Title', body: 'coping.learn3Body' },
  ]
  return (
    <div className="content-page coping-page">
      <header className="page-header">
        <p className="eyebrow">{t('coping.eyebrow')}</p>
        <h1>{t('coping.title')}</h1>
        <p className="lead">{t('coping.body')}</p>
      </header>
      <section className="selected-panel">
        <div>
          <p className="eyebrow">{t('coping.selectedTitle')}</p>
          <p>{t('coping.selectedBody')}</p>
        </div>
        <strong>{selected.length}</strong>
      </section>
      <section>
        <h2 className="section-title">{t('coping.learnTitle')}</h2>
        <div className="learning-grid">
          {learningSteps.map((step) => (
            <article className="learning-card" key={step.number}>
              <span>{step.number}</span>
              <h3>{t(step.title)}</h3>
              <p>{t(step.body)}</p>
            </article>
          ))}
        </div>
      </section>
      <section>
        <h2 className="section-title">{t('coping.allTitle')}</h2>
        <div className="strategy-grid">
          {strategies.map((strategy) => (
            <StrategyCard key={strategy.coping_strategy_id} strategy={strategy} />
          ))}
        </div>
      </section>
      <CustomStrategyForm />
    </div>
  )
}

function StrategyCard({ strategy }: { strategy: CopingStrategyRecord }) {
  const { t } = useTranslation()
  const toggle = useCopingStore((state) => state.toggleSelected)
  const error = useCopingStore((state) => state.error)
  const id = strategy.catalog_strategy_id
  const title = id ? t(strategyKey(id, 'title')) : strategy.custom_title
  return (
    <article className={`strategy-card ${strategy.is_selected ? 'active' : ''}`}>
      <div className="strategy-card-head">
        <span className="strategy-symbol" aria-hidden="true">
          {id ? strategyIcon[id] : '+'}
        </span>
        <div>
          <h3>{title}</h3>
          <div className="badge-row">
            {!id && <span className="badge custom">{t('coping.customBadge')}</span>}
            <span className="badge">
              {strategy.is_selected ? t('coping.activeBadge') : t('coping.inactiveBadge')}
            </span>
          </div>
        </div>
        <button
          className="switch"
          role="switch"
          aria-checked={strategy.is_selected === 1}
          aria-label={title ?? undefined}
          onClick={() => void toggle(strategy.coping_strategy_id)}
        >
          <span />
        </button>
      </div>
      <p>{id ? t(strategyKey(id, 'summary')) : strategy.custom_note}</p>
      {id && (
        <div className="strategy-detail">
          <div>
            <strong>{t('coping.whyLabel')}</strong>
            <p>{t(strategyKey(id, 'why'))}</p>
          </div>
          <div>
            <strong>{t('coping.whenLabel')}</strong>
            <p>{t(strategyKey(id, 'when'))}</p>
          </div>
        </div>
      )}
      {error === 'selection-required' && strategy.is_selected === 1 && (
        <p className="form-error">{t('coping.errorLast')}</p>
      )}
    </article>
  )
}

function CustomStrategyForm() {
  const { t } = useTranslation()
  const add = useCopingStore((state) => state.addCustom)
  const status = useCopingStore((state) => state.status)
  const storeError = useCopingStore((state) => state.error)
  const [title, setTitle] = useState('')
  const [note, setNote] = useState('')
  const [required, setRequired] = useState(false)
  async function submit(event: SyntheticEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!title.trim()) {
      setRequired(true)
      return
    }
    setRequired(false)
    await add(title, note)
    if (useCopingStore.getState().status === 'ready') {
      setTitle('')
      setNote('')
    }
  }
  return (
    <section className="surface-card custom-form">
      <h2>{t('coping.addTitle')}</h2>
      <p>{t('coping.addBody')}</p>
      <form
        onSubmit={(event) => {
          void submit(event)
        }}
      >
        <div className="field-stack">
          <label htmlFor="new-title">{t('coping.customTitleLabel')}</label>
          <input
            id="new-title"
            maxLength={80}
            value={title}
            placeholder={t('coping.customTitlePlaceholder')}
            onChange={(event) => {
              setTitle(event.target.value)
            }}
          />
          {required && <span className="form-error">{t('coping.errorRequired')}</span>}
          <label htmlFor="new-note">{t('coping.customNoteLabel')}</label>
          <textarea
            id="new-note"
            maxLength={240}
            rows={3}
            value={note}
            placeholder={t('coping.customNotePlaceholder')}
            onChange={(event) => {
              setNote(event.target.value)
            }}
          />
        </div>
        <button className="primary-button" disabled={status === 'saving'}>
          {t('coping.add')}
        </button>
        {storeError === 'save-failed' && <p className="form-error">{t('coping.errorSave')}</p>}
      </form>
    </section>
  )
}

function Placeholder() {
  const { t } = useTranslation()
  return (
    <div className="content-page">
      <section className="empty-panel">
        <span aria-hidden="true">◇</span>
        <h1>{t('placeholder.title')}</h1>
        <p>{t('placeholder.body')}</p>
      </section>
    </div>
  )
}
