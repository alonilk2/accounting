import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { MainLayout } from './MainLayout';
import { AppThemeProvider } from './AppThemeProvider';
import { useAuthStore, useUIStore } from '../stores';
import type { User, Company } from '../types/entities';

// Mock react-router-dom
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

// Mock user and company data
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
    <AppThemeProvider>
      {children}
    </AppThemeProvider>
  </BrowserRouter>
);

const TestContent = () => (
  <div data-testid="test-content">Test Content</div>
);

describe('MainLayout', () => {
  beforeEach(() => {
    // Reset stores before each test
    useAuthStore.getState().logout();
    useUIStore.getState().setSidebarOpen(true);
    useUIStore.getState().setTheme('light');
    useUIStore.getState().setLanguage('en');
    
    // Mock authenticated user
    useAuthStore.getState().login(mockUser, mockCompany);
    
    // Clear mocks
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

    // Check if main content is rendered
    expect(screen.getByTestId('test-content')).toBeInTheDocument();
    
    // Check if app bar is rendered
    expect(screen.getByText('Accounting System')).toBeInTheDocument();
    
    // Check if company name is displayed in sidebar
    expect(screen.getByText('Test Company Ltd')).toBeInTheDocument();
    
    // Check if navigation items are rendered
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Customers')).toBeInTheDocument();
    expect(screen.getByText('Sales Orders')).toBeInTheDocument();
  });

  it('should display Hebrew text when language is set to Hebrew', () => {
    useUIStore.getState().setLanguage('he');
    
    render(
      <TestWrapper>
        <MainLayout>
          <TestContent />
        </MainLayout>
      </TestWrapper>
    );

    // Check if Hebrew text is displayed
    expect(screen.getByText('מערכת הנהלת חשבונות')).toBeInTheDocument();
    expect(screen.getByText('לוח בקרה')).toBeInTheDocument();
    expect(screen.getByText('לקוחות')).toBeInTheDocument();
  });

  it('should toggle sidebar when menu button is clicked', () => {
    render(
      <TestWrapper>
        <MainLayout>
          <TestContent />
        </MainLayout>
      </TestWrapper>
    );

    const menuButton = screen.getByLabelText('open drawer');
    
    // Sidebar should be open initially
    expect(useUIStore.getState().sidebarOpen).toBe(true);
    
    // Click menu button to close sidebar
    fireEvent.click(menuButton);
    expect(useUIStore.getState().sidebarOpen).toBe(false);
    
    // Click again to open sidebar
    fireEvent.click(menuButton);
    expect(useUIStore.getState().sidebarOpen).toBe(true);
  });

  it('should navigate when navigation items are clicked', () => {
    render(
      <TestWrapper>
        <MainLayout>
          <TestContent />
        </MainLayout>
      </TestWrapper>
    );

    // Click on Customers navigation item
    const customersLink = screen.getByText('Customers');
    fireEvent.click(customersLink);
    
    expect(mockNavigate).toHaveBeenCalledWith('/customers');
  });

  it('should show user avatar and handle profile menu', () => {
    render(
      <TestWrapper>
        <MainLayout>
          <TestContent />
        </MainLayout>
      </TestWrapper>
    );

    // Click on user avatar
    const userAvatar = screen.getByLabelText('account of current user');
    fireEvent.click(userAvatar);
    
    // Profile menu should appear
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

    // Open profile menu
    const userAvatar = screen.getByLabelText('account of current user');
    fireEvent.click(userAvatar);
    
    // Click logout
    const logoutButton = screen.getByText('Logout');
    fireEvent.click(logoutButton);
    
    // Should navigate to login and clear auth state
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

    // Find theme toggle switch
    const themeSwitch = screen.getByRole('checkbox', { name: /dark mode/i });
    
    // Should be light theme initially
    expect(useUIStore.getState().theme).toBe('light');
    expect(themeSwitch).not.toBeChecked();
    
    // Toggle to dark theme
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

    // Find language toggle switch
    const languageSwitch = screen.getByRole('checkbox', { name: /hebrew/i });
    
    // Should be English initially
    expect(useUIStore.getState().language).toBe('en');
    expect(languageSwitch).not.toBeChecked();
    
    // Toggle to Hebrew
    fireEvent.click(languageSwitch);
    expect(useUIStore.getState().language).toBe('he');
  });

  it('should display company tax ID when available', () => {
    render(
      <TestWrapper>
        <MainLayout>
          <TestContent />
        </MainLayout>
      </TestWrapper>
    );

    expect(screen.getByText('Tax ID: 123456789')).toBeInTheDocument();
  });

  it('should group navigation items by sections', () => {
    render(
      <TestWrapper>
        <MainLayout>
          <TestContent />
        </MainLayout>
      </TestWrapper>
    );

    // Check if section headers are displayed
    expect(screen.getByText('Sales')).toBeInTheDocument();
    expect(screen.getByText('Purchasing')).toBeInTheDocument();
    expect(screen.getByText('Inventory')).toBeInTheDocument();
    expect(screen.getByText('Accounting')).toBeInTheDocument();
  });

  it('should highlight active navigation item', () => {
    // Mock location to be on customers page
    mockLocation.pathname = '/customers';
    
    render(
      <TestWrapper>
        <MainLayout>
          <TestContent />
        </MainLayout>
      </TestWrapper>
    );

    const customersItem = screen.getByText('Customers').closest('div');
    expect(customersItem).toHaveClass('Mui-selected');
  });
});
