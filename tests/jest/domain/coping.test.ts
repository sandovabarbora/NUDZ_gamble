import {
  activeStrategies,
  createCatalogStrategyRecord,
  createCustomStrategyRecord,
  hasAtLeastOneSelectedStrategy,
  setStrategySelected,
} from '@domain/coping'

const now = '2026-08-15T08:00:00.000Z'

describe('coping strategy domain', () => {
  it('creates a stable catalog record', () => {
    const record = createCatalogStrategyRecord('A001', 'walk-15', true, 0, now)
    expect(record).toMatchObject({
      coping_strategy_id: 'catalog:walk-15',
      source: 'catalog',
      catalog_strategy_id: 'walk-15',
      is_selected: 1,
    })
  })

  it('normalizes and validates a custom strategy', () => {
    const record = createCustomStrategyRecord({
      userId: 'A001',
      title: '  Zavolám   sestře  ',
      note: 'Po večeři',
      sortOrder: 5,
      now,
      id: 'fixed-id',
    })
    expect(record.custom_title).toBe('Zavolám sestře')
    expect(record.coping_strategy_id).toBe('custom:fixed-id')
    expect(record.is_selected).toBe(1)
    expect(() =>
      createCustomStrategyRecord({ userId: 'A001', title: '  ', sortOrder: 0, now, id: 'x' }),
    ).toThrow('custom-title-required')
  })

  it('can enforce at least one selected active strategy', () => {
    const selected = createCatalogStrategyRecord('A001', 'walk-15', true, 0, now)
    expect(hasAtLeastOneSelectedStrategy([selected])).toBe(true)
    expect(hasAtLeastOneSelectedStrategy([setStrategySelected(selected, false, now)])).toBe(false)
  })

  it('sorts active records and excludes archived records', () => {
    const later = createCatalogStrategyRecord('A001', 'call-close-person', true, 2, now)
    const first = createCatalogStrategyRecord('A001', 'walk-15', true, 0, now)
    expect(activeStrategies([{ ...first, archived_at: now }, later])).toEqual([later])
  })
})
