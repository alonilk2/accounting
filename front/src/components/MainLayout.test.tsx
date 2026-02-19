import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { MainLayout } from './MainLayout';
import { AppThemeProvider } from './AppThemeProvider';
import { useAuthStore, useUIStore } from '../stores';
import type { User, Company } from '../types/entities';

const mockNavigate = vi.fn();
const mockLocation = { pathname: '/' };

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useLocation: () => mockLocation,
  };
});

const mockUser: User = {
  id: 'user-1',
  name: 'Test User',
  email: 'test@example.com',
  roleId: 'role-1',
  companyId: 'company-1',
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockCompany: Company = {
  id: 1,
  name: 'Test Company Ltd',
  israelTaxId: '123456789',
  address: 'Test Address',
  currency: 'ILS',
  fiscalYearStartMonth: 1,
  timeZone: 'Asia/Jerusalem',
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <BrowserRouter>
    <AppThemeProvider>{children}</AppThemeProvider>
  </BrowserRouter>
);

const TestContent = () => <div data-testid="test-content">Test Content</div>;

describe('MainLayout', () => {
  beforeEach(() => {
    useAuthStore.getState().logout();
    useUIStore.getState().setTheme('light');
    useUIStore.getState().setLanguage('en');
    mockLocation.pathname = '/';

    useAuthStore.getState().login(mockUser, mockCompany);
    mockNavigate.mockClear();
  });

  it('should render main layout with navigation and content', () => {
    render(
      <TestWrapper>
        <MainLayout>
          <TestContent />
        </MainLayout>
      </TestWrapper>
    );

    expect(screen.getByTestId('test-content')).toBeInTheDocument();
    expect(screen.getByTitle('Test User')).toBeInTheDocument();
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Customers')).toBeInTheDocument();
    expect(screen.getByText('Orders')).toBeInTheDocument();
  });

  it('should display translated labels when language is set to Hebrew', () => {
    useUIStore.getState().setLanguage('he');

    render(
      <TestWrapper>
        <MainLayout>
          <TestContent />
        </MainLayout>
      </TestWrapper>
    );

    expect(screen.queryByText('Home Page')).not.toBeInTheDocument();
    const hebrewTextNodes = screen.getAllByText((content) => /[\u0590-\u05FF]/.test(content));
    expect(hebrewTextNodes.length).toBeGreaterThan(0);
  });

  it('should keep the navigation drawer rendered', () => {
    render(
      <TestWrapper>
        <MainLayout>
          <TestContent />
        </MainLayout>
      </TestWrapper>
    );

    expect(screen.getByRole('navigation')).toBeInTheDocument();
  });

  it('should navigate when navigation items are clicked', () => {
    render(
      <TestWrapper>
        <MainLayout>
          <TestContent />
        </MainLayout>
      </TestWrapper>
    );

    fireEvent.click(screen.getByText('Customers'));
    expect(mockNavigate).toHaveBeenCalledWith('/customers');
  });

  it('should show profile menu when profile section is clicked', () => {
    render(
      <TestWrapper>
        <MainLayout>
          <TestContent />
        </MainLayout>
      </TestWrapper>
    );

    fireEvent.click(screen.getByTitle('Test User'));
    expect(screen.getByText('Profile')).toBeInTheDocument();
    expect(screen.getByText('Logout')).toBeInTheDocument();
  });

  it('should handle logout correctly', () => {
    render(
      <TestWrapper>
        <MainLayout>
          <TestContent />
        </MainLayout>
      </TestWrapper>
    );

    fireEvent.click(screen.getByTitle('Test User'));
    fireEvent.click(screen.getByText('Logout'));

    expect(mockNavigate).toHaveBeenCalledWith('/login');
    expect(useAuthStore.getState().isAuthenticated).toBe(false);
  });

  it('should toggle theme when theme switch is used', () => {
    render(
      <TestWrapper>
        <MainLayout>
          <TestContent />
        </MainLayout>
      </TestWrapper>
    );

    const nav = screen.getByRole('navigation');
    const switches = within(nav).getAllByRole('checkbox');
    const themeSwitch = switches[0];

    expect(useUIStore.getState().theme).toBe('light');
    expect(themeSwitch).not.toBeChecked();

    fireEvent.click(themeSwitch);
    expect(useUIStore.getState().theme).toBe('dark');
  });

  it('should toggle language when language switch is used', () => {
    render(
      <TestWrapper>
        <MainLayout>
          <TestContent />
        </MainLayout>
      </TestWrapper>
    );

    const nav = screen.getByRole('navigation');
    const switches = within(nav).getAllByRole('checkbox');
    const languageSwitch = switches[1];

    expect(useUIStore.getState().language).toBe('en');
    expect(languageSwitch).not.toBeChecked();

    fireEvent.click(languageSwitch);
    expect(useUIStore.getState().language).toBe('he');
  });

  it('should display authenticated user details in sidebar', () => {
    render(
      <TestWrapper>
        <MainLayout>
          <TestContent />
        </MainLayout>
      </TestWrapper>
    );

    expect(screen.getByTitle('test@example.com')).toBeInTheDocument();
  });

  it('should group navigation items by sections', () => {
    render(
      <TestWrapper>
        <MainLayout>
          <TestContent />
        </MainLayout>
      </TestWrapper>
    );

    expect(screen.getByText('Sales')).toBeInTheDocument();
    expect(screen.getByText('Purchasing')).toBeInTheDocument();
    expect(screen.getAllByText('Inventory').length).toBeGreaterThan(0);
    expect(screen.getByText('Accounting')).toBeInTheDocument();
  });

  it('should highlight active navigation item', () => {
    mockLocation.pathname = '/customers';

    render(
      <TestWrapper>
        <MainLayout>
          <TestContent />
        </MainLayout>
      </TestWrapper>
    );

    const customersItem = screen.getByText('Customers').closest('.MuiListItemButton-root');
    expect(customersItem).toHaveClass('Mui-selected');
  });
});
