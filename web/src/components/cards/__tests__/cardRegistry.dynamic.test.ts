import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  CARD_CHUNK_PRELOADERS,
  CARD_COMPONENTS,
  CARD_DEFAULT_WIDTHS,
  DEMO_DATA_CARDS,
  LIVE_DATA_CARDS,
  prefetchCardChunks,
  registerDynamicCardType,
} from '../cardRegistry.dynamic'

// Importing the leaf must never load the category/dashboard assembly graph.
vi.mock('../cardRegistry.index', () => { throw new Error('Registry assembler loaded by leaf') })
vi.mock('../cardRegistry.compliance', () => { throw new Error('Category loaded by leaf') })

const CARD_TYPE = '__dynamic_leaf_test__'
const CUSTOM_WIDTH = 8
const DEFAULT_WIDTH = 6

afterEach(() => {
  delete CARD_DEFAULT_WIDTHS[CARD_TYPE]
  delete CARD_CHUNK_PRELOADERS[CARD_TYPE]
  vi.restoreAllMocks()
})

describe('cardRegistry.dynamic', () => {
  it('can load without assembling card categories', () => {
    expect(CARD_COMPONENTS).toEqual({})
    expect(DEMO_DATA_CARDS.size).toBe(0)
    expect(LIVE_DATA_CARDS.size).toBe(0)
  })

  it('registers and updates dynamic widths without loading the assembler', () => {
    registerDynamicCardType(CARD_TYPE)
    expect(CARD_DEFAULT_WIDTHS[CARD_TYPE]).toBe(DEFAULT_WIDTH)
    registerDynamicCardType(CARD_TYPE, CUSTOM_WIDTH)
    expect(CARD_DEFAULT_WIDTHS[CARD_TYPE]).toBe(CUSTOM_WIDTH)
  })

  it('prefetches populated loaders and skips unknown card types', () => {
    const load = vi.fn().mockResolvedValue({})
    CARD_CHUNK_PRELOADERS[CARD_TYPE] = load
    prefetchCardChunks(['__unknown_card__', CARD_TYPE])
    expect(load).toHaveBeenCalledOnce()
  })

  it('reports failed prefetches without rejecting', async () => {
    const error = new Error('Chunk unavailable')
    CARD_CHUNK_PRELOADERS[CARD_TYPE] = vi.fn().mockRejectedValue(error)
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    prefetchCardChunks([CARD_TYPE])
    await Promise.resolve()
    expect(warn).toHaveBeenCalledWith('[CardRegistry] Failed to prefetch card chunk:', CARD_TYPE, error)
  })
})
