import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import ChartOfAccounts from './ChartOfAccounts';
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

describe('ChartOfAccounts', () => {
  beforeEach(() => {
    useUIStore.getState().setLanguage('en');
    mockNavigate.mockClear();
    mockUseFeatureAccess.mockReset();
  });

  it('renders locked state with upgrade CTA when feature access is denied', () => {
    mockUseFeatureAccess.mockReturnValue({
      hasAccess: false,
      reason: 'Current plan does not include this feature.',
      currentPlan: 'Basic',
      loading: false,
      refresh: vi.fn(),
    });

    render(<ChartOfAccounts />);

    expect(screen.getByText('Chart of Accounts is locked')).toBeInTheDocument();
    expect(screen.getByText('Current plan: Basic')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Upgrade plan' }));
    expect(mockNavigate).toHaveBeenCalledWith('/company-management');
  });

  it('renders normal page content when feature access is granted', () => {
    mockUseFeatureAccess.mockReturnValue({
      hasAccess: true,
      reason: undefined,
      currentPlan: 'Pro',
      loading: false,
      refresh: vi.fn(),
    });

    render(<ChartOfAccounts />);

    expect(screen.getByRole('heading', { name: 'Chart of Accounts' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Add Account' })).toBeInTheDocument();
  });
});
