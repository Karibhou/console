import '@testing-library/jest-dom/vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { OperatorAITab, OperatorCRDsTab, OperatorCSVTab } from './OperatorDrillDown.detailTabs.parts'
import type { CSVInfo } from './operator-drilldown'

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}))

vi.mock('../../ui/ConsoleAIIcon', () => ({
  ConsoleAIIcon: () => <span>AI icon</span>,
}))

const phaseStyle = { bg: 'bg-green-500', text: 'text-green-500', border: 'border-green-500' }
const csvInfo: CSVInfo = {
  name: 'cert-manager.v1.14.0',
  displayName: 'Cert Manager',
  version: '1.14.0',
  phase: 'Succeeded',
  maturity: 'stable',
  provider: 'Jetstack',
  maintainers: [{ name: 'Maintainer', email: 'ops@example.com' }],
  installModes: [
    { type: 'OwnNamespace', supported: true },
    { type: 'AllNamespaces', supported: false },
  ],
}

describe('Operator detail tabs', () => {
  it('shows CSV details, maintainers, and supported install modes', () => {
    render(<OperatorCSVTab csvInfo={csvInfo} csvLoading={false} phaseStyle={phaseStyle} />)

    expect(screen.getByText(csvInfo.name)).toBeInTheDocument()
    expect(screen.getByText(csvInfo.displayName)).toBeInTheDocument()
    expect(screen.getByText('Jetstack')).toBeInTheDocument()
    expect(screen.getByText('Maintainer <ops@example.com>')).toBeInTheDocument()
    expect(screen.getByText('OwnNamespace: drilldown.operator.yes')).toBeInTheDocument()
    expect(screen.getByText('AllNamespaces: drilldown.operator.no')).toBeInTheDocument()
  })

  it('shows the CSV empty state after loading ends', () => {
    const { rerender } = render(<OperatorCSVTab csvInfo={null} csvLoading phaseStyle={phaseStyle} />)
    expect(screen.queryByText('drilldown.operator.csvNotAvailable')).not.toBeInTheDocument()

    rerender(<OperatorCSVTab csvInfo={null} csvLoading={false} phaseStyle={phaseStyle} />)
    expect(screen.getByText('drilldown.operator.csvNotAvailable')).toBeInTheDocument()
  })

  it('shows owned CRDs and opens the selected CRD', async () => {
    const onCRDClick = vi.fn()
    render(<OperatorCRDsTab operatorCRDs={[{
      name: 'certificates.cert-manager.io',
      kind: 'Certificate',
      version: 'v1',
      description: 'A TLS certificate',
    }]} crdsLoading={false} onCRDClick={onCRDClick} />)

    expect(screen.getByText('Certificate')).toBeInTheDocument()
    expect(screen.getByText('A TLS certificate')).toBeInTheDocument()
    await userEvent.setup().click(screen.getByText('certificates.cert-manager.io'))
    expect(onCRDClick).toHaveBeenCalledExactlyOnceWith('certificates.cert-manager.io')
  })

  it('shows the CRD empty state after loading ends', () => {
    const { rerender } = render(<OperatorCRDsTab operatorCRDs={null} crdsLoading onCRDClick={vi.fn()} />)
    expect(screen.queryByText('drilldown.operator.noCRDs')).not.toBeInTheDocument()

    rerender(<OperatorCRDsTab operatorCRDs={[]} crdsLoading={false} onCRDClick={vi.fn()} />)
    expect(screen.getByText('drilldown.operator.noCRDs')).toBeInTheDocument()
  })

  it('keeps diagnosis disabled while disconnected and invokes it when connected', async () => {
    const onDiagnose = vi.fn()
    const { rerender } = render(<OperatorAITab isAgentConnected={false} aiAnalysis={null} aiAnalysisLoading={false} onDiagnose={onDiagnose} />)
    const diagnose = screen.getByRole('button', { name: 'drilldown.operator.analyzeOperator' })
    expect(diagnose).toBeDisabled()
    expect(screen.getByText('drilldown.ai.notConnected')).toBeInTheDocument()

    rerender(<OperatorAITab isAgentConnected aiAnalysis={null} aiAnalysisLoading={false} onDiagnose={onDiagnose} />)
    expect(screen.getByText('drilldown.operator.clickAnalyze')).toBeInTheDocument()
    await userEvent.setup().click(diagnose)
    expect(onDiagnose).toHaveBeenCalledOnce()
  })

  it('shows AI loading and analysis results', () => {
    const { rerender } = render(<OperatorAITab isAgentConnected aiAnalysis={null} aiAnalysisLoading onDiagnose={vi.fn()} />)
    expect(screen.queryByText('Healthy operator')).not.toBeInTheDocument()

    rerender(<OperatorAITab isAgentConnected aiAnalysis="Healthy operator" aiAnalysisLoading={false} onDiagnose={vi.fn()} />)
    expect(screen.getByText('Healthy operator')).toBeInTheDocument()
  })
})
