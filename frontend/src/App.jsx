import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider } from './context/AuthContext'
import AppLayout from './components/layout/AppLayout'
import { LoadingPage } from './components/ui'

// Eagerly loaded (needed immediately on auth)
import LoginPage from './pages/auth/LoginPage'
import NotFoundPage from './pages/NotFoundPage'

// Lazy loaded pages — split into separate chunks
const DashboardPage          = lazy(() => import('./pages/dashboard/DashboardPage'))
const TransactionsPage       = lazy(() => import('./pages/transactions/TransactionsPage'))
const TransactionDetailPage  = lazy(() => import('./pages/transactions/TransactionDetailPage'))
const FraudDetectionPage     = lazy(() => import('./pages/fraud/FraudDetectionPage'))
const InvestigationsPage     = lazy(() => import('./pages/investigations/InvestigationsPage'))
const InvestigationDetailPage = lazy(() => import('./pages/investigations/InvestigationDetailPage'))
const ReportsPage            = lazy(() => import('./pages/reports/ReportsPage'))
const AnalyticsPage          = lazy(() => import('./pages/analytics/AnalyticsPage'))
const CustomerChatPage       = lazy(() => import('./pages/chat/CustomerChatPage'))
const ProfilePage            = lazy(() => import('./pages/auth/ProfilePage'))

function SuspenseWrapper({ children }) {
  return <Suspense fallback={<LoadingPage />}>{children}</Suspense>
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 3500,
            style: { fontSize: '14px', borderRadius: '10px' }
          }}
        />
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/" element={<AppLayout />}>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard"         element={<SuspenseWrapper><DashboardPage /></SuspenseWrapper>} />
            <Route path="transactions"      element={<SuspenseWrapper><TransactionsPage /></SuspenseWrapper>} />
            <Route path="transactions/:id"  element={<SuspenseWrapper><TransactionDetailPage /></SuspenseWrapper>} />
            <Route path="fraud-detection"   element={<SuspenseWrapper><FraudDetectionPage /></SuspenseWrapper>} />
            <Route path="investigations"    element={<SuspenseWrapper><InvestigationsPage /></SuspenseWrapper>} />
            <Route path="investigations/:id" element={<SuspenseWrapper><InvestigationDetailPage /></SuspenseWrapper>} />
            <Route path="reports"           element={<SuspenseWrapper><ReportsPage /></SuspenseWrapper>} />
            <Route path="analytics"         element={<SuspenseWrapper><AnalyticsPage /></SuspenseWrapper>} />
            <Route path="customer-chat"     element={<SuspenseWrapper><CustomerChatPage /></SuspenseWrapper>} />
            <Route path="profile"           element={<SuspenseWrapper><ProfilePage /></SuspenseWrapper>} />
          </Route>
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
