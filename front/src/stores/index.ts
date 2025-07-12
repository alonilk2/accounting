import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import type { User, Company } from '../types/entities';

// Authentication state
interface AuthState {
  user: User | null;
  company: Company | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

interface AuthActions {
  login: (user: User, company: Company) => void;
  logout: () => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
}

type AuthStore = AuthState & AuthActions;

export const useAuthStore = create<AuthStore>()(
  devtools(
    persist(
      (set) => ({
        // Initial state
        user: null,
        company: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,

        // Actions
        login: (user: User, company: Company) => {
          set(
            {
              user,
              company,
              isAuthenticated: true,
              error: null,
            },
            false,
            'auth/login'
          );
        },

        logout: () => {
          set(
            {
              user: null,
              company: null,
              isAuthenticated: false,
              error: null,
            },
            false,
            'auth/logout'
          );
        },

        setLoading: (loading: boolean) => {
          set({ isLoading: loading }, false, 'auth/setLoading');
        },

        setError: (error: string | null) => {
          set({ error }, false, 'auth/setError');
        },

        clearError: () => {
          set({ error: null }, false, 'auth/clearError');
        },
      }),
      {
        name: 'auth-storage',
        partialize: (state) => ({
          user: state.user,
          company: state.company,
          isAuthenticated: state.isAuthenticated,
        }),
      }
    ),
    {
      name: 'auth-store',
    }
  )
);

// UI state for global UI components
interface UIState {
  sidebarOpen: boolean;
  theme: 'light' | 'dark';
  language: 'en' | 'he';
  notifications: Notification[];
}

interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  autoClose?: boolean;
  duration?: number;
}

interface UIActions {
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  setTheme: (theme: 'light' | 'dark') => void;
  setLanguage: (language: 'en' | 'he') => void;
  addNotification: (notification: Omit<Notification, 'id'>) => void;
  removeNotification: (id: string) => void;
  clearNotifications: () => void;
}

type UIStore = UIState & UIActions;

export const useUIStore = create<UIStore>()(
  devtools(
    persist(
      (set, get) => ({
        // Initial state
        sidebarOpen: true,
        theme: 'light',
        language: 'en',
        notifications: [],

        // Actions
        toggleSidebar: () => {
          set(
            (state) => ({ sidebarOpen: !state.sidebarOpen }),
            false,
            'ui/toggleSidebar'
          );
        },

        setSidebarOpen: (open: boolean) => {
          set({ sidebarOpen: open }, false, 'ui/setSidebarOpen');
        },

        setTheme: (theme: 'light' | 'dark') => {
          set({ theme }, false, 'ui/setTheme');
        },

        setLanguage: (language: 'en' | 'he') => {
          set({ language }, false, 'ui/setLanguage');
        },

        addNotification: (notification: Omit<Notification, 'id'>) => {
          const id = Math.random().toString(36).substring(2, 15);
          const newNotification: Notification = {
            ...notification,
            id,
            autoClose: notification.autoClose ?? true,
            duration: notification.duration ?? 5000,
          };

          set(
            (state) => ({
              notifications: [...state.notifications, newNotification],
            }),
            false,
            'ui/addNotification'
          );

          // Auto-remove notification if autoClose is enabled
          if (newNotification.autoClose) {
            setTimeout(() => {
              get().removeNotification(id);
            }, newNotification.duration);
          }
        },

        removeNotification: (id: string) => {
          set(
            (state) => ({
              notifications: state.notifications.filter((n) => n.id !== id),
            }),
            false,
            'ui/removeNotification'
          );
        },

        clearNotifications: () => {
          set({ notifications: [] }, false, 'ui/clearNotifications');
        },
      }),
      {
        name: 'ui-storage',
        partialize: (state) => ({
          theme: state.theme,
          language: state.language,
          sidebarOpen: state.sidebarOpen,
        }),
      }
    ),
    {
      name: 'ui-store',
    }
  )
);

// Export notification type for use in components
export type { Notification };

// Export AI Assistant store
export { useAIAssistantStore } from './aiAssistantStore';
