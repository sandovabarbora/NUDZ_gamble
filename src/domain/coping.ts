export const CATALOG_STRATEGY_IDS = [
  'walk-15',
  'call-close-person',
  'take-shower',
  'name-feeling',
  'go-running',
] as const

export type CatalogStrategyId = (typeof CATALOG_STRATEGY_IDS)[number]
export type CopingStrategySource = 'catalog' | 'custom'

export interface CopingStrategyRecord {
  coping_strategy_id: string
  user_id: string
  source: CopingStrategySource
  catalog_strategy_id: CatalogStrategyId | null
  custom_title: string | null
  custom_note: string | null
  is_selected: 0 | 1
  sort_order: number
  created_at: string
  updated_at: string
  archived_at: string | null
}

export interface CreateCustomStrategyInput {
  userId: string
  title: string
  note?: string
  sortOrder: number
  now: string
  id?: string
}

export const DEFAULT_SELECTED_STRATEGY_IDS: readonly CatalogStrategyId[] = [
  'walk-15',
  'call-close-person',
]

export const CUSTOM_STRATEGY_TITLE_MAX_LENGTH = 80
export const CUSTOM_STRATEGY_NOTE_MAX_LENGTH = 240

export function isCatalogStrategyId(value: string): value is CatalogStrategyId {
  return CATALOG_STRATEGY_IDS.some((id) => id === value)
}

export function createCatalogStrategyRecord(
  userId: string,
  catalogStrategyId: CatalogStrategyId,
  selected: boolean,
  sortOrder: number,
  now: string,
): CopingStrategyRecord {
  return {
    coping_strategy_id: `catalog:${catalogStrategyId}`,
    user_id: userId,
    source: 'catalog',
    catalog_strategy_id: catalogStrategyId,
    custom_title: null,
    custom_note: null,
    is_selected: selected ? 1 : 0,
    sort_order: sortOrder,
    created_at: now,
    updated_at: now,
    archived_at: null,
  }
}

export function createCustomStrategyRecord({
  userId,
  title,
  note = '',
  sortOrder,
  now,
  id = globalThis.crypto.randomUUID(),
}: CreateCustomStrategyInput): CopingStrategyRecord {
  const normalizedTitle = normalizeSingleLine(title)
  const normalizedNote = note.trim()

  if (!normalizedTitle) throw new Error('custom-title-required')
  if (normalizedTitle.length > CUSTOM_STRATEGY_TITLE_MAX_LENGTH) {
    throw new Error('custom-title-too-long')
  }
  if (normalizedNote.length > CUSTOM_STRATEGY_NOTE_MAX_LENGTH) {
    throw new Error('custom-note-too-long')
  }

  return {
    coping_strategy_id: `custom:${id}`,
    user_id: userId,
    source: 'custom',
    catalog_strategy_id: null,
    custom_title: normalizedTitle,
    custom_note: normalizedNote || null,
    is_selected: 1,
    sort_order: sortOrder,
    created_at: now,
    updated_at: now,
    archived_at: null,
  }
}

export function setStrategySelected(
  strategy: CopingStrategyRecord,
  selected: boolean,
  now: string,
): CopingStrategyRecord {
  return { ...strategy, is_selected: selected ? 1 : 0, updated_at: now }
}

export function archiveStrategy(strategy: CopingStrategyRecord, now: string): CopingStrategyRecord {
  return { ...strategy, is_selected: 0, archived_at: now, updated_at: now }
}

export function activeStrategies(strategies: readonly CopingStrategyRecord[]) {
  return strategies
    .filter((strategy) => strategy.archived_at === null)
    .toSorted((a, b) => a.sort_order - b.sort_order)
}

export function selectedStrategies(strategies: readonly CopingStrategyRecord[]) {
  return activeStrategies(strategies).filter((strategy) => strategy.is_selected === 1)
}

export function hasAtLeastOneSelectedStrategy(
  strategies: readonly CopingStrategyRecord[],
): boolean {
  return selectedStrategies(strategies).length > 0
}

function normalizeSingleLine(value: string): string {
  return value.replace(/\s+/g, ' ').trim()
}
