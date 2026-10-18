import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { AlertAITab, AlertLabelsTab, AlertSourceTab } from '../AlertSecondaryTabs.parts'

const panelProps = { role: 'tabpanel', id: 'alert-panel', 'aria-labelledby': 'alert-tab' }

describe('Alert secondary tab panels', () => {
  it('renders every label and passes the exact label pair to copy', () => {
    const onCopy = vi.fn()
    const { rerender } = render(
      <AlertLabelsTab tabPanelProps={panelProps} labelEntries={[
        ['namespace', 'monitoring'], ['severity', 'critical'],
      ]} copiedField={null} onCopy={onCopy} />,
    )

    expect(screen.getByRole('tabpanel')).toHaveAttribute('aria-labelledby', 'alert-tab')
    expect(screen.getByText('monitoring')).toBeVisible()
    expect(screen.getByText('critical')).toBeVisible()
    fireEvent.click(screen.getAllByRole('button', { name: 'drilldown.alertDetail.copyLabel' })[1])
    expect(onCopy).toHaveBeenCalledWith('severity', 'severity=critical')

    rerender(<AlertLabelsTab tabPanelProps={panelProps} labelEntries={[
      ['namespace', 'monitoring'], ['severity', 'critical'],
    ]} copiedField="severity" onCopy={onCopy} />)
    expect(screen.getAllByRole('button', { name: 'drilldown.alertDetail.copyLabel' })[1]
      .querySelector('svg.lucide-check')).toBeTruthy()
  })

  it('shows source loading, rule content, and unavailable states', () => {
    const { rerender, container } = render(
      <AlertSourceTab tabPanelProps={panelProps} sourceLoading sourceRule={null} />,
    )
    expect(container.querySelector('.animate-spin')).toBeTruthy()

    rerender(<AlertSourceTab tabPanelProps={panelProps} sourceLoading={false} sourceRule="alert: HighCPU" />)
    expect(screen.getByText('alert: HighCPU')).toBeVisible()

    rerender(<AlertSourceTab tabPanelProps={panelProps} sourceLoading={false} sourceRule={null} />)
    expect(screen.getByText('drilldown.alertDetail.ruleNotAvailable')).toBeVisible()
  })

  it('disables diagnosis without an agent and shows connected states', () => {
    const onDiagnose = vi.fn()
    const { rerender, container } = render(
      <AlertAITab tabPanelProps={panelProps} isAgentConnected={false}
        aiAnalysisLoading={false} aiAnalysis={null} onDiagnose={onDiagnose} />,
    )
    const diagnose = screen.getByRole('button', { name: 'drilldown.alertDetail.diagnoseAlert' })
    expect(diagnose).toBeDisabled()
    expect(screen.getByText('drilldown.ai.notConnected')).toBeVisible()

    rerender(<AlertAITab tabPanelProps={panelProps} isAgentConnected
      aiAnalysisLoading aiAnalysis={null} onDiagnose={onDiagnose} />)
    expect(container.querySelector('.animate-spin')).toBeTruthy()

    rerender(<AlertAITab tabPanelProps={panelProps} isAgentConnected
      aiAnalysisLoading={false} aiAnalysis="CPU is saturated" onDiagnose={onDiagnose} />)
    expect(screen.getByText('CPU is saturated')).toBeVisible()
    fireEvent.click(diagnose)
    expect(onDiagnose).toHaveBeenCalledOnce()

    rerender(<AlertAITab tabPanelProps={panelProps} isAgentConnected
      aiAnalysisLoading={false} aiAnalysis={null} onDiagnose={onDiagnose} />)
    expect(screen.getByText('drilldown.alertDetail.clickDiagnose')).toBeVisible()
  })
})
