import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AppThemeProvider } from './components/AppThemeProvider';
import { MainLayout } from './components/MainLayout';
import { useAuthStore } from './stores';

// Import page components
import {
  Dashboard,
  Customers,
  Sales,
  Invoices,
  Suppliers,
  Purchases,
  Inventory,
  ChartOfAccounts,
  Reports,
  Settings,
  Login,
} from './pages';

function App() {
  const { isAuthenticated } = useAuthStore();

  if (!isAuthenticated) {
    return (
      <AppThemeProvider>
        <Router>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </Router>
      </AppThemeProvider>
    );
  }

  return (
    <AppThemeProvider>
      <Router>
        <MainLayout>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/customers" element={<Customers />} />
            <Route path="/sales" element={<Sales />} />
            <Route path="/invoices" element={<Invoices />} />
            <Route path="/suppliers" element={<Suppliers />} />
            <Route path="/purchases" element={<Purchases />} />
            <Route path="/inventory" element={<Inventory />} />
            <Route path="/accounts" element={<ChartOfAccounts />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </MainLayout>
      </Router>
    </AppThemeProvider>
  );
}

export default App;
