import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AppThemeProvider } from './components/AppThemeProvider';
import { MainLayout } from './components/MainLayout';
import { useAuthStore } from './stores';

// Import page components
import {
  Dashboard,
  Customers,
  SalesDocumentsPage,
  SalesOrdersPage,
  CreateTaxInvoiceReceiptPage,
  DeliveryNotes,
  Suppliers,
  Purchases,
  PurchaseInvoicesPage,
  Inventory,
  ChartOfAccounts,
  Reports,
  Company,
  Settings,
  Login,
  AIAssistantPage,
} from './pages';
import Quotes from './pages/Quotes';

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
            <Route path="/quotes" element={<Quotes />} />
            <Route path="/sales-documents" element={<SalesDocumentsPage />} />
            <Route path="/sales-orders" element={<SalesOrdersPage />} />
            <Route path="/delivery-notes" element={<DeliveryNotes />} />
            <Route path="/tax-invoice-receipts/create" element={<CreateTaxInvoiceReceiptPage />} />
            <Route path="/suppliers" element={<Suppliers />} />
            <Route path="/purchases" element={<Purchases />} />
            <Route path="/purchase-invoices" element={<PurchaseInvoicesPage />} />
            <Route path="/inventory" element={<Inventory />} />
            <Route path="/accounts" element={<ChartOfAccounts />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/company-management" element={<Company />} />
            <Route path="/ai-assistant" element={<AIAssistantPage />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </MainLayout>
      </Router>
    </AppThemeProvider>
  );
}

export default App;
