import { describe, it, expect, beforeEach } from 'vitest';
import { useAuthStore, useUIStore } from './index';
import type { User, Company } from '../types/entities';

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
  name: 'Test Company',
  israelTaxId: '123456789',
  address: 'Test Address',
  currency: 'ILS',
  fiscalYearStartMonth: 1,
  timeZone: 'Asia/Jerusalem',
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe('Auth Store', () => {
  beforeEach(() => {
    // Reset store before each test
    useAuthStore.getState().logout();
    useAuthStore.getState().clearError();
    useAuthStore.getState().setLoading(false);
  });

  describe('Initial State', () => {
    it('should have correct initial state', () => {
      const state = useAuthStore.getState();
      
      expect(state.user).toBeNull();
      expect(state.company).toBeNull();
      expect(state.isAuthenticated).toBe(false);
      expect(state.isLoading).toBe(false);
      expect(state.error).toBeNull();
    });
  });

  describe('Login Action', () => {
    it('should update state when user logs in', () => {
      const { login } = useAuthStore.getState();
      
      login(mockUser, mockCompany);
      
      const state = useAuthStore.getState();
      expect(state.user).toEqual(mockUser);
      expect(state.company).toEqual(mockCompany);
      expect(state.isAuthenticated).toBe(true);
      expect(state.error).toBeNull();
    });
  });

  describe('Logout Action', () => {
    it('should clear state when user logs out', () => {
      const { login, logout } = useAuthStore.getState();
      
      // First login
      login(mockUser, mockCompany);
      expect(useAuthStore.getState().isAuthenticated).toBe(true);
      
      // Then logout
      logout();
      
      const state = useAuthStore.getState();
      expect(state.user).toBeNull();
      expect(state.company).toBeNull();
      expect(state.isAuthenticated).toBe(false);
      expect(state.error).toBeNull();
    });
  });

  describe('Loading State', () => {
    it('should update loading state', () => {
      const { setLoading } = useAuthStore.getState();
      
      setLoading(true);
      expect(useAuthStore.getState().isLoading).toBe(true);
      
      setLoading(false);
      expect(useAuthStore.getState().isLoading).toBe(false);
    });
  });

  describe('Error Handling', () => {
    it('should set and clear errors', () => {
      const { setError, clearError } = useAuthStore.getState();
      
      const errorMessage = 'Test error';
      setError(errorMessage);
      expect(useAuthStore.getState().error).toBe(errorMessage);
      
      clearError();
      expect(useAuthStore.getState().error).toBeNull();
    });
  });
});

describe('UI Store', () => {
  beforeEach(() => {
    // Reset UI store before each test
    useUIStore.getState().setSidebarOpen(true);
    useUIStore.getState().setTheme('light');
    useUIStore.getState().setLanguage('en');
    useUIStore.getState().clearNotifications();
  });

  describe('Initial State', () => {
    it('should have correct initial state', () => {
      const state = useUIStore.getState();
      
      expect(state.sidebarOpen).toBe(true);
      expect(state.theme).toBe('light');
      expect(state.language).toBe('en');
      expect(state.notifications).toEqual([]);
    });
  });

  describe('Sidebar Actions', () => {
    it('should toggle sidebar', () => {
      const { toggleSidebar } = useUIStore.getState();
      
      expect(useUIStore.getState().sidebarOpen).toBe(true);
      
      toggleSidebar();
      expect(useUIStore.getState().sidebarOpen).toBe(false);
      
      toggleSidebar();
      expect(useUIStore.getState().sidebarOpen).toBe(true);
    });

    it('should set sidebar state directly', () => {
      const { setSidebarOpen } = useUIStore.getState();
      
      setSidebarOpen(false);
      expect(useUIStore.getState().sidebarOpen).toBe(false);
      
      setSidebarOpen(true);
      expect(useUIStore.getState().sidebarOpen).toBe(true);
    });
  });

  describe('Theme Actions', () => {
    it('should set theme', () => {
      const { setTheme } = useUIStore.getState();
      
      setTheme('dark');
      expect(useUIStore.getState().theme).toBe('dark');
      
      setTheme('light');
      expect(useUIStore.getState().theme).toBe('light');
    });
  });

  describe('Language Actions', () => {
    it('should set language', () => {
      const { setLanguage } = useUIStore.getState();
      
      setLanguage('he');
      expect(useUIStore.getState().language).toBe('he');
      
      setLanguage('en');
      expect(useUIStore.getState().language).toBe('en');
    });
  });

  describe('Notification Actions', () => {
    it('should add notification', () => {
      const { addNotification } = useUIStore.getState();
      
      const notification = {
        type: 'success' as const,
        title: 'Test',
        message: 'Test message',
      };
      
      addNotification(notification);
      
      const state = useUIStore.getState();
      expect(state.notifications).toHaveLength(1);
      expect(state.notifications[0].type).toBe('success');
      expect(state.notifications[0].title).toBe('Test');
      expect(state.notifications[0].message).toBe('Test message');
      expect(state.notifications[0].id).toBeDefined();
      expect(state.notifications[0].autoClose).toBe(true);
      expect(state.notifications[0].duration).toBe(5000);
    });

    it('should add notification with custom properties', () => {
      const { addNotification } = useUIStore.getState();
      
      const notification = {
        type: 'error' as const,
        title: 'Error',
        message: 'Error message',
        autoClose: false,
        duration: 10000,
      };
      
      addNotification(notification);
      
      const state = useUIStore.getState();
      expect(state.notifications[0].autoClose).toBe(false);
      expect(state.notifications[0].duration).toBe(10000);
    });

    it('should remove notification', () => {
      const { addNotification, removeNotification } = useUIStore.getState();
      
      addNotification({
        type: 'info',
        title: 'Test',
        message: 'Test message',
      });
      
      const notificationId = useUIStore.getState().notifications[0].id;
      expect(useUIStore.getState().notifications).toHaveLength(1);
      
      removeNotification(notificationId);
      expect(useUIStore.getState().notifications).toHaveLength(0);
    });

    it('should clear all notifications', () => {
      const { addNotification, clearNotifications } = useUIStore.getState();
      
      // Add multiple notifications
      addNotification({ type: 'success', title: 'Test 1', message: 'Message 1' });
      addNotification({ type: 'error', title: 'Test 2', message: 'Message 2' });
      
      expect(useUIStore.getState().notifications).toHaveLength(2);
      
      clearNotifications();
      expect(useUIStore.getState().notifications).toHaveLength(0);
    });
  });
});
