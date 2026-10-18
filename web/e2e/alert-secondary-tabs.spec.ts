import { expect, test } from '@playwright/test'
import { setupDemoMode } from './helpers/setup'

const ALERTS_PAGE_TIMEOUT_MS = 30_000

test('Alert drilldown switches between Labels, Source, and AI panels', async ({ page }) => {
  await setupDemoMode(page)
  // Vite serves source modules below /src/lib/api; let them bypass the API mock.
  await page.route('**/src/lib/api/**', route => route.continue())
  await page.goto('/alerts', { waitUntil: 'domcontentloaded' })

  const alertCard = page.locator('[data-card-type="active_alerts"]')
  await expect(alertCard).toBeVisible({ timeout: ALERTS_PAGE_TIMEOUT_MS })
  await alertCard.locator('[data-keynav-item="alert"] [role="button"]').first().click()

  const modal = page.getByTestId('drilldown-modal')
  await expect(modal).toBeVisible()
  await modal.locator('[role="tab"][data-tab-id="labels"]').click()
  await expect(modal.locator('[role="tabpanel"]').last()).toContainText('All Labels')

  await modal.locator('[role="tab"][data-tab-id="source"]').click()
  await expect(modal.locator('[role="tabpanel"]').last()).toContainText('Alert Rule Source')

  await modal.locator('[role="tab"][data-tab-id="ai"]').click()
  await expect(modal.locator('[role="tabpanel"]').last()).toContainText('AI agent not connected')
  await expect(modal.locator('button').filter({ hasText: 'Diagnose Alert' })).toBeDisabled()
})
