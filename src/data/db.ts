import Dexie from 'dexie'
import type { EntityTable } from 'dexie'

import type { CopingStrategyRecord } from '@domain/coping.ts'

interface BootstrapRecord {
  id: string
}

/** IndexedDB wiring. Each new entity or index is introduced as a new version. */
export class AppDatabase extends Dexie {
  _bootstrap!: EntityTable<BootstrapRecord, 'id'>
  coping_strategies!: EntityTable<CopingStrategyRecord, 'coping_strategy_id'>

  constructor(name = 'nudz-gamble') {
    super(name)
    this.version(1).stores({ _bootstrap: 'id' })
    this.version(2).stores({
      _bootstrap: 'id',
      coping_strategies:
        'coping_strategy_id,user_id,source,catalog_strategy_id,updated_at,archived_at',
    })
  }
}

export const db = new AppDatabase()
