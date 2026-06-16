"use client"
import { BrowserRouter as Router, Routes, Route } from "react-router-dom"
import { AuthProvider } from "./context/AuthContext"
import { AppProvider } from "./context/AppContext"
import { ThemeProvider } from "./context/ThemeContext"
import ProtectedRoute from "./components/Auth/ProtectedRoute"
import Login from "./components/Auth/Login"
import Signup from "./components/Auth/Signup"
import ForgotPassword from "./components/Auth/ForgotPassword"
import Layout from "./components/Layout/Layout"
import Dashboard from "./components/Dashboard/Dashboard"
import InvoicesPage from "./components/Dashboard/InvoicesPage"
import CreateInvoice from "./components/Invoice/CreateInvoice"
import Profile from "./components/Profile/Profile"
import Analytics from "./components/Analytics/Analytics"
import PurchaseBillsPage from "./components/PurchaseBills/PurchaseBillsPage"
import CreatePurchaseBill from "./components/PurchaseBills/CreatePurchaseBill"
import LedgersPage from "./components/Invoice/LedgersPage"
import GSTReports from "./components/Analytics/GSTReports"
import LandingPage from "./pages/LandingPage"
import PrivacyPage from "./pages/privacy"
import TermsPage from "./pages/terms"
import ToastContainer from "./components/UI/ToastContainer"
import { useToast } from "./hooks/useToast"

function AppContent() {
  const { toasts, removeToast } = useToast()

  return (
    <>
      <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/features" element={<LandingPage />} />
          <Route path="/pricing" element={<LandingPage />} />
          <Route path="/faq" element={<LandingPage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/privacy" element={<PrivacyPage />} />
          <Route path="/terms" element={<TermsPage />} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Dashboard />} />
            <Route path="create-invoice" element={<CreateInvoice />} />
            <Route path="edit-invoice/:id" element={<CreateInvoice />} />
            <Route path="invoices" element={<InvoicesPage />} />
            <Route path="purchase-bills" element={<PurchaseBillsPage />} />
            <Route path="create-purchase-bill" element={<CreatePurchaseBill />} />
            <Route path="edit-purchase-bill/:id" element={<CreatePurchaseBill />} />
            <Route path="ledgers" element={<LedgersPage />} />
            <Route path="gst-reports" element={<GSTReports />} />
            <Route path="analytics" element={<Analytics />} />
            <Route path="profile" element={<Profile />} />
          </Route>
        </Routes>
      </Router>
      <ToastContainer toasts={toasts} onClose={removeToast} />
    </>
  )
}

function App() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <AppProvider>
          <AppContent />
        </AppProvider>
      </ThemeProvider>
    </AuthProvider>
  )
}

export default App
