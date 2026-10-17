import React from 'react'
import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, within } from '@testing-library/react'
import { ComplianceClusterBreakdown, CompliancePagination } from '../ComplianceFooter.parts'
import type { ControlRow } from '../compliance-drilldown'

const navigation = () => ({
  onFirst: vi.fn(), onPrev: vi.fn(), onNext: vi.fn(), onLast: vi.fn(),
})

describe('CompliancePagination', () => {
  it('shows the first page range and disables backward navigation', () => {
    const handlers = navigation()
    render(<CompliancePagination page={0} totalPages={3} totalRows={60} {...handlers} />)

    expect(screen.getByText('Showing 1–25 of 60 controls')).toBeTruthy()
    expect(screen.getByText('Page 1 of 3')).toBeTruthy()
    expect(screen.getByRole('button', { name: 'First page' }).hasAttribute('disabled')).toBe(true)
    expect(screen.getByRole('button', { name: 'Previous page' }).hasAttribute('disabled')).toBe(true)
    fireEvent.click(screen.getByRole('button', { name: 'Next page' }))
    fireEvent.click(screen.getByRole('button', { name: 'Last page' }))
    expect(handlers.onNext).toHaveBeenCalledOnce()
    expect(handlers.onLast).toHaveBeenCalledOnce()
    expect(handlers.onFirst).not.toHaveBeenCalled()
    expect(handlers.onPrev).not.toHaveBeenCalled()
  })

  it('shows the final partial range and disables forward navigation', () => {
    const handlers = navigation()
    render(<CompliancePagination page={2} totalPages={3} totalRows={60} {...handlers} />)

    expect(screen.getByText('Showing 51–60 of 60 controls')).toBeTruthy()
    expect(screen.getByText('Page 3 of 3')).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Next page' }).hasAttribute('disabled')).toBe(true)
    expect(screen.getByRole('button', { name: 'Last page' }).hasAttribute('disabled')).toBe(true)
    fireEvent.click(screen.getByRole('button', { name: 'First page' }))
    fireEvent.click(screen.getByRole('button', { name: 'Previous page' }))
    expect(handlers.onFirst).toHaveBeenCalledOnce()
    expect(handlers.onPrev).toHaveBeenCalledOnce()
    expect(handlers.onNext).not.toHaveBeenCalled()
    expect(handlers.onLast).not.toHaveBeenCalled()
  })
})

const row = (cluster: string, status: ControlRow['status']): ControlRow => ({
  cluster, status, controlId: 'AC-1', title: 'Access control', severity: 'medium',
})

describe('ComplianceClusterBreakdown', () => {
  it('counts matching controls, selects the displayed cluster, and marks the active filter', () => {
    const onClusterClick = vi.fn()
    render(<ComplianceClusterBreakdown
      uniqueClusters={['region/alpha', 'beta']}
      filteredRows={[row('region/alpha', 'pass'), row('region/alpha', 'fail'), row('beta', 'pass')]}
      clusterFilter="region/alpha"
      onClusterClick={onClusterClick}
    />)

    const alpha = screen.getByRole('button', { name: /alpha/ })
    expect(within(alpha).getByText('1 pass')).toBeTruthy()
    expect(within(alpha).getByText('1 fail')).toBeTruthy()
    expect(within(alpha).getByText('50%')).toBeTruthy()
    expect(alpha.className).toContain('border-blue-500/40')
    const beta = screen.getByRole('button', { name: /beta/ })
    expect(within(beta).getByText('100%')).toBeTruthy()
    expect(beta.className).toContain('border-border')
    fireEvent.click(alpha)
    fireEvent.click(beta)
    expect(onClusterClick).toHaveBeenNthCalledWith(1, 'region/alpha')
    expect(onClusterClick).toHaveBeenNthCalledWith(2, 'beta')
  })

  it('shows zero counts when a cluster has no rows after filtering', () => {
    render(<ComplianceClusterBreakdown
      uniqueClusters={['empty']}
      filteredRows={[]}
      clusterFilter=""
      onClusterClick={vi.fn()}
    />)

    const empty = screen.getByRole('button', { name: /empty/ })
    expect(within(empty).getByText('0 pass')).toBeTruthy()
    expect(within(empty).getByText('0 fail')).toBeTruthy()
    expect(within(empty).getByText('0%')).toBeTruthy()
  })

  it('shows the warning score for a cluster between the good and low thresholds', () => {
    render(<ComplianceClusterBreakdown
      uniqueClusters={['mid']}
      filteredRows={[...Array.from({ length: 7 }, () => row('mid', 'pass')), ...Array.from({ length: 3 }, () => row('mid', 'fail'))]}
      clusterFilter=""
      onClusterClick={vi.fn()}
    />)

    expect(screen.getByText('70%').className).toContain('text-yellow-400')
  })
})
