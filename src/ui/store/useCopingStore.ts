import { create } from 'zustand'

import { copingStrategyRepository } from '@data/copingStrategyRepository.ts'
import {
  CATALOG_STRATEGY_IDS,
  createCatalogStrategyRecord,
  createCustomStrategyRecord,
  DEFAULT_SELECTED_STRATEGY_IDS,
  hasAtLeastOneSelectedStrategy,
  setStrategySelected,
  type CatalogStrategyId,
  type CopingStrategyRecord,
} from '@domain/coping.ts'

export const DEMO_USER_ID = 'A001'

interface CompleteOnboardingInput {
  selectedCatalogIds: readonly CatalogStrategyId[]
  customTitle: string
  customNote: string
}

interface CopingStoreState {
  strategies: CopingStrategyRecord[]
  status: 'idle' | 'loading' | 'ready' | 'saving' | 'error'
  hasCompletedCopingOnboarding: boolean
  error: string | null
  load: () => Promise<void>
  completeOnboarding: (input: CompleteOnboardingInput) => Promise<void>
  addCustom: (title: string, note: string) => Promise<void>
  toggleSelected: (strategyId: string) => Promise<boolean>
}

function currentTimestamp(): string {
  return new Date().toISOString()
}

export const useCopingStore = create<CopingStoreState>((set, get) => ({
  strategies: [],
  status: 'idle',
  hasCompletedCopingOnboarding: false,
  error: null,

  load: async () => {
    set({ status: 'loading', error: null })
    try {
      const strategies = await copingStrategyRepository.listForUser(DEMO_USER_ID)
      set({
        strategies,
        status: 'ready',
        hasCompletedCopingOnboarding: strategies.length > 0,
      })
    } catch {
      set({ status: 'error', error: 'load-failed' })
    }
  },

  completeOnboarding: async ({ selectedCatalogIds, customTitle, customNote }) => {
    set({ status: 'saving', error: null })
    const now = currentTimestamp()
    const records: CopingStrategyRecord[] = CATALOG_STRATEGY_IDS.map((id, index) =>
      createCatalogStrategyRecord(DEMO_USER_ID, id, selectedCatalogIds.includes(id), index, now),
    )

    if (customTitle.trim()) {
      records.push(
        createCustomStrategyRecord({
          userId: DEMO_USER_ID,
          title: customTitle,
          note: customNote,
          sortOrder: records.length,
          now,
        }),
      )
    }

    if (!hasAtLeastOneSelectedStrategy(records)) {
      set({ status: 'ready', error: 'selection-required' })
      return
    }

    try {
      await copingStrategyRepository.replaceOnboardingSelection(DEMO_USER_ID, records)
      set({
        strategies: records,
        status: 'ready',
        hasCompletedCopingOnboarding: true,
        error: null,
      })
    } catch {
      set({ status: 'error', error: 'save-failed' })
    }
  },

  addCustom: async (title, note) => {
    set({ status: 'saving', error: null })
    const strategy = createCustomStrategyRecord({
      userId: DEMO_USER_ID,
      title,
      note,
      sortOrder: get().strategies.length,
      now: currentTimestamp(),
    })
    try {
      await copingStrategyRepository.save(strategy)
      set((state) => ({
        strategies: [...state.strategies, strategy],
        status: 'ready',
      }))
    } catch {
      set({ status: 'error', error: 'save-failed' })
    }
  },

  toggleSelected: async (strategyId) => {
    const strategy = get().strategies.find((item) => item.coping_strategy_id === strategyId)
    if (!strategy) return false

    const next = setStrategySelected(strategy, strategy.is_selected === 0, currentTimestamp())
    const candidate = get().strategies.map((item) =>
      item.coping_strategy_id === strategyId ? next : item,
    )
    if (!hasAtLeastOneSelectedStrategy(candidate)) {
      set({ error: 'selection-required' })
      return false
    }

    try {
      await copingStrategyRepository.save(next)
      set({ strategies: candidate, error: null })
      return true
    } catch {
      set({ error: 'save-failed' })
      return false
    }
  },
}))

export const initialSelectedCatalogIds = [...DEFAULT_SELECTED_STRATEGY_IDS]
