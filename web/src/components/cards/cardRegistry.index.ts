import { isDynamicCardRegistered } from '../../lib/dynamic-cards/dynamicCardRegistry'
import { logger } from '../../lib/logger'
import { registerCardComponentResolver } from '../../lib/unified/dashboard/cardComponentResolver'
import { registerAllDescriptorCards } from './cardDescriptors.registry'
import { CARD_TITLES, CARD_DESCRIPTIONS, DEMO_EXEMPT_CARDS } from './cardMetadata'
import { quantumCardRegistry } from './cardRegistry.quantum'
import { aimlCardRegistry } from './cardRegistry.aiml'
import { complianceCardRegistry } from './cardRegistry.compliance'
import { coreCardRegistry } from './cardRegistry.core'
import { gitopsCardRegistry } from './cardRegistry.gitops'
import { miscCardRegistry } from './cardRegistry.misc'
import { multiTenancyCardRegistry } from './cardRegistry.multiTenancy'
import { observabilityCardRegistry } from './cardRegistry.observability'
import type { CardComponent } from './cardRegistry.types'
import {
  CARD_COMPONENTS, CARD_CHUNK_PRELOADERS, CARD_DEFAULT_WIDTHS,
  DEMO_DATA_CARDS, LIVE_DATA_CARDS,
} from './cardRegistry.dynamic'

export {
  CARD_COMPONENTS, CARD_DEFAULT_WIDTHS, DEMO_DATA_CARDS, LIVE_DATA_CARDS,
  prefetchCardChunks, registerDynamicCardType,
} from './cardRegistry.dynamic'

export type { CardComponent, CardComponentProps } from './cardRegistry.types'
export { DEMO_EXEMPT_CARDS }
export { aimlCardRegistry } from './cardRegistry.aiml'
export { complianceCardRegistry } from './cardRegistry.compliance'
export { coreCardRegistry } from './cardRegistry.core'
export { gitopsCardRegistry } from './cardRegistry.gitops'
export { miscCardRegistry } from './cardRegistry.misc'
export { multiTenancyCardRegistry } from './cardRegistry.multiTenancy'
export { observabilityCardRegistry } from './cardRegistry.observability'

const DOMAIN_REGISTRIES = {
  core: coreCardRegistry,
  compliance: complianceCardRegistry,
  multiTenancy: multiTenancyCardRegistry,
  observability: observabilityCardRegistry,
  aiml: aimlCardRegistry,
  gitops: gitopsCardRegistry,
  misc: miscCardRegistry,
} as const

function mergeRegistryDomains() {
  const components: Record<string, CardComponent> = {}
  const chunkPreloaders: Record<string, () => Promise<unknown>> = {}
  const defaultWidths: Record<string, number> = {}
  const demoDataCards = new Set<string>()
  const liveDataCards = new Set<string>()
  const seenCardTypes = new Map<string, string>()

  for (const [domainName, registry] of Object.entries(DOMAIN_REGISTRIES)) {
    for (const [cardType, component] of Object.entries(registry.components)) {
      const existing = seenCardTypes.get(cardType)
      if (existing) {
        throw new Error(`Duplicate card type "${cardType}" in ${existing} and ${domainName}`)
      }
      seenCardTypes.set(cardType, domainName)
      components[cardType] = component
    }

    Object.assign(chunkPreloaders, registry.chunkPreloaders)
    Object.assign(defaultWidths, registry.defaultWidths)
    registry.demoDataCards.forEach(cardType => demoDataCards.add(cardType))
    registry.liveDataCards.forEach(cardType => liveDataCards.add(cardType))
  }

  return { components, chunkPreloaders, defaultWidths, demoDataCards, liveDataCards }
}

const mergedRegistry = mergeRegistryDomains()

Object.assign(CARD_COMPONENTS, mergedRegistry.components)
Object.assign(CARD_CHUNK_PRELOADERS, mergedRegistry.chunkPreloaders)
Object.assign(CARD_DEFAULT_WIDTHS, mergedRegistry.defaultWidths)
mergedRegistry.demoDataCards.forEach(cardType => DEMO_DATA_CARDS.add(cardType))
mergedRegistry.liveDataCards.forEach(cardType => LIVE_DATA_CARDS.add(cardType))

Object.assign(CARD_COMPONENTS, quantumCardRegistry.components)
Object.assign(CARD_CHUNK_PRELOADERS, quantumCardRegistry.preloaders)
Object.assign(CARD_DEFAULT_WIDTHS, quantumCardRegistry.defaultWidths)

registerAllDescriptorCards({
  components: CARD_COMPONENTS,
  preloaders: CARD_CHUNK_PRELOADERS,
  defaultWidths: CARD_DEFAULT_WIDTHS,
  titles: CARD_TITLES,
  descriptions: CARD_DESCRIPTIONS,
  demoDataCards: DEMO_DATA_CARDS,
  liveDataCards: LIVE_DATA_CARDS,
  demoExemptCards: DEMO_EXEMPT_CARDS,
})

export function prefetchDemoCardChunks(): void {
  const startupChunks = [
    () => import('./ServiceExports'),
    () => import('./ServiceImports'),
    () => import('./GatewayStatus'),
    () => import('./ServiceTopology'),
    () => import('./ArgoCDApplications'),
    () => import('./ArgoCDHealth'),
    () => import('./ArgoCDSyncStatus'),
    () => import('./KustomizationStatus'),
    () => import('./OverlayComparison'),
    () => import('./OpenCostOverview'),
    () => import('./KubecostOverview'),
    () => import('./KyvernoPolicies'),
    () => import('./ComplianceCards'),
    () => import('./DataComplianceCards'),
    () => import('./workload-detection/MLJobs'),
    () => import('./workload-detection/MLNotebooks'),
    () => import('./KagentiStatusCard'),
    () => import('./kagenti/KagentiAgentFleet'),
    () => import('./kagenti/KagentiBuildPipeline'),
    () => import('./kagenti/KagentiToolRegistry'),
    () => import('./kagenti/KagentiAgentDiscovery'),
    () => import('./kagenti/KagentiSecurity'),
    () => import('./kagenti/KagentiTopology'),
    () => import('./KagentStatusCard'),
    () => import('./kagent/KagentAgentFleet'),
    () => import('./kagent/KagentToolRegistry'),
    () => import('./kagent/KagentModelProviders'),
    () => import('./kagent/KagentAgentDiscovery'),
    () => import('./kagent/KagentSecurity'),
    () => import('./kagent/KagentTopology'),
    () => import('./crossplane-status/CrossplaneManagedResources'),
    () => import('./VClusterStatus'),
  ]

  startupChunks.forEach(load => load().catch((e) => logger.warn('[CardRegistry] Failed to prefetch demo card chunk:', e)))
}

const DEFAULT_CARD_WIDTH = 4

export function getDefaultCardWidth(cardType: string): number {
  return CARD_DEFAULT_WIDTHS[cardType] ?? DEFAULT_CARD_WIDTH
}

export function getCardComponent(cardType: string): CardComponent | undefined {
  const staticComponent = CARD_COMPONENTS[cardType]
  if (staticComponent) return staticComponent

  if (isDynamicCardRegistered(cardType)) {
    return CARD_COMPONENTS.dynamic_card
  }

  console.warn(
    `[cardRegistry] Unknown card type "${cardType}" — no component registered. ` +
    'Check for typos in the dashboard config or register the card in cardRegistry.ts.',
  )

  return undefined
}

registerCardComponentResolver(getCardComponent)

export function isCardTypeRegistered(cardType: string): boolean {
  return cardType in CARD_COMPONENTS || isDynamicCardRegistered(cardType)
}

export function getRegisteredCardTypes(): string[] {
  return Object.keys(CARD_COMPONENTS)
}
