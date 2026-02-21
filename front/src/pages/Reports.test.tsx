import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import Reports from './Reports';
import { useUIStore } from '../stores';

const mockNavigate = vi.fn();
const mockUseFeatureAccess = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

vi.mock('../hooks/useFeatureAccess', () => ({
  useFeatureAccess: (...args: unknown[]) => mockUseFeatureAccess(...args),
}));

vi.mock('../components/reports/CustomerStatementGenerator', () => ({
  default: () => <div>Customer Statement Component</div>,
}));

vi.mock('../components/tax/UnifiedFormatExport', () => ({
  default: () => <div>Unified Format Export Component</div>,
}));

vi.mock('../components/tax/IsraeliTaxReporting', () => ({
  default: () => <div>Israeli Tax Reporting Component</div>,
}));

describe('Reports', () => {
  beforeEach(() => {
    useUIStore.getState().setLanguage('en');
    mockNavigate.mockClear();
    mockUseFeatureAccess.mockReset();
  });

  it('keeps general reports visible while locking accounting tabs for non-entitled companies', () => {
    mockUseFeatureAccess.mockReturnValue({
      hasAccess: false,
      reason: 'Current plan does not include this feature.',
      currentPlan: 'Basic',
      loading: false,
      refresh: vi.fn(),
    });

    render(<Reports />);

    expect(screen.getByText('Profit & Loss')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('tab', { name: 'Unified Format Export' }));
    expect(screen.getByText('Accounting reports are locked')).toBeInTheDocument();
    expect(screen.getByText('Current plan: Basic')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Upgrade plan' }));
    expect(mockNavigate).toHaveBeenCalledWith('/company-management');
  });

  it('shows accounting components for entitled companies', () => {
    mockUseFeatureAccess.mockReturnValue({
      hasAccess: true,
      reason: undefined,
      currentPlan: 'Enterprise',
      loading: false,
      refresh: vi.fn(),
    });

    render(<Reports />);

    fireEvent.click(screen.getByRole('tab', { name: 'Unified Format Export' }));
    expect(screen.getByText('Unified Format Export Component')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('tab', { name: 'Form 6111' }));
    expect(screen.getByText('Israeli Tax Reporting Component')).toBeInTheDocument();
  });
});
