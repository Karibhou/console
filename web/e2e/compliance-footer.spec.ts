import { test, expect } from '@playwright/test'
import { mockApiMe, mockLocalAgentUnavailable } from './helpers/setup'

const DASHBOARD_READY_TIMEOUT_MS = 30_000

test('Compliance Trestle drilldown paginates controls and filters the cluster breakdown', async ({ page }) => {
  await mockApiMe(page)
  await mockLocalAgentUnavailable(page)
  await page.addInitScript(() => {
    localStorage.setItem('token', 'demo-token')
    localStorage.setItem('kc-demo-mode', 'true')
    localStorage.setItem('demo-user-onboarded', 'true')
    localStorage.setItem('kc-agent-setup-dismissed', 'true')
  })
  await page.goto('/compliance')

  const card = page.locator('[data-card-type="trestle_scan"]')
  await expect(card).toBeVisible({ timeout: DASHBOARD_READY_TIMEOUT_MS })
  await card.locator('button[title="View all compliance controls"]').first().click()
  const setupDismiss = page.getByRole('button', { name: 'Remind Me Later' })
  if (await setupDismiss.isVisible()) await setupDismiss.click()

  const modal = page.getByTestId('drilldown-modal')
  await expect(modal.getByText('OSCAL Compliance Controls', { exact: true }).last()).toBeVisible()
  await expect(modal.getByText('Showing 1–25 of', { exact: false })).toBeVisible()
  await modal.locator('button[aria-label="Next page"]').click()
  await expect(modal.getByText('Showing 26–50 of', { exact: false })).toBeVisible()
  await modal.locator('button[aria-label="First page"]').click()
  await expect(modal.getByText('Showing 1–25 of', { exact: false })).toBeVisible()

  const breakdown = modal.getByText('Per-cluster breakdown').locator('..')
  const firstCluster = breakdown.locator('button').first()
  const clusterName = await firstCluster.locator('div').first().textContent()
  await firstCluster.click()
  await expect(firstCluster).toHaveClass(/border-blue-500/)
  await expect(modal.getByText('OSCAL Compliance Controls', { exact: true }).last()).toBeVisible()
  expect(clusterName?.trim().length).toBeGreaterThan(0)
})
