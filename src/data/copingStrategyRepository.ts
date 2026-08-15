import type { CopingStrategyRecord } from '@domain/coping.ts'

import { db, type AppDatabase } from './db.ts'

export class CopingStrategyRepository {
  private readonly database: AppDatabase

  constructor(database: AppDatabase = db) {
    this.database = database
  }

  async listForUser(userId: string): Promise<CopingStrategyRecord[]> {
    const strategies = await this.database.coping_strategies
      .where('user_id')
      .equals(userId)
      .toArray()
    return strategies.toSorted((a, b) => a.sort_order - b.sort_order)
  }

  async save(strategy: CopingStrategyRecord): Promise<void> {
    await this.database.coping_strategies.put(strategy)
  }

  async saveMany(strategies: readonly CopingStrategyRecord[]): Promise<void> {
    await this.database.coping_strategies.bulkPut([...strategies])
  }

  async replaceOnboardingSelection(
    userId: string,
    strategies: readonly CopingStrategyRecord[],
  ): Promise<void> {
    await this.database.transaction('rw', this.database.coping_strategies, async () => {
      await this.database.coping_strategies.where('user_id').equals(userId).delete()
      await this.database.coping_strategies.bulkAdd([...strategies])
    })
  }
}

export const copingStrategyRepository = new CopingStrategyRepository()
