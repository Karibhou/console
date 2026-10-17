import { logger } from '../../lib/logger'
import type { CardChunkPreloader, CardComponent } from './cardRegistry.types'

// Shared identities populated by cardRegistry.index during application startup.
// Keep this module independent of category registries and dashboard components:
// leaf consumers must be able to access state without importing the assembler.
export const CARD_COMPONENTS: Record<string, CardComponent> = {}
export const CARD_CHUNK_PRELOADERS: Record<string, CardChunkPreloader> = {}
export const CARD_DEFAULT_WIDTHS: Record<string, number> = {}
export const DEMO_DATA_CARDS = new Set<string>()
export const LIVE_DATA_CARDS = new Set<string>()

export function prefetchCardChunks(cardTypes: string[]): void {
  for (const type of cardTypes) {
    CARD_CHUNK_PRELOADERS[type]?.()?.catch((e) => logger.warn('[CardRegistry] Failed to prefetch card chunk:', type, e))
  }
}

const DEFAULT_DYNAMIC_CARD_WIDTH = 6

export function registerDynamicCardType(cardType: string, width = DEFAULT_DYNAMIC_CARD_WIDTH): void {
  CARD_DEFAULT_WIDTHS[cardType] = width
}
