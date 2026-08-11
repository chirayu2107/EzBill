"use client"
import { BrowserRouter as Router, Routes, Route } from "react-router-dom"
import { Suspense, lazy } from "react"
import { AuthProvider } from "./context/AuthContext"
import { AppProvider } from "./context/AppContext"
import { ThemeProvider } from "./context/ThemeContext"
import ToastContainer from "./components/UI/ToastContainer"
import { useToast } from "./hooks/useToast"

// ── Eagerly load only the always-visible pieces ──────────────────────────────
import ProtectedRoute from "./components/Auth/ProtectedRoute"

// ── Lazy-load every page/route ───────────────────────────────────────────────
const LandingPage        = lazy(() => import("./pages/LandingPage"))
const Login              = lazy(() => import("./components/Auth/Login"))
const Signup             = lazy(() => import("./components/Auth/Signup"))
const ForgotPassword     = lazy(() => import("./components/Auth/ForgotPassword"))
const PrivacyPage        = lazy(() => import("./pages/privacy"))
const TermsPage          = lazy(() => import("./pages/terms"))

const Layout             = lazy(() => import("./components/Layout/Layout"))
const Dashboard          = lazy(() => import("./components/Dashboard/Dashboard"))
const InvoicesPage       = lazy(() => import("./components/Dashboard/InvoicesPage"))
const CreateInvoice      = lazy(() => import("./components/Invoice/CreateInvoice"))
const Profile            = lazy(() => import("./components/Profile/Profile"))
const Analytics          = lazy(() => import("./components/Analytics/Analytics"))
const PurchaseBillsPage  = lazy(() => import("./components/PurchaseBills/PurchaseBillsPage"))
const CreatePurchaseBill = lazy(() => import("./components/PurchaseBills/CreatePurchaseBill"))
const LedgersPage        = lazy(() => import("./components/Invoice/LedgersPage"))
const GSTReports         = lazy(() => import("./components/Analytics/GSTReports"))

// ── Minimal fallback — invisible spinner so transitions feel instant ───────────
const PageFallback = () => (
  <div className="fixed inset-0 flex items-center justify-center bg-surface-light dark:bg-black">
    <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
  </div>
)

function AppContent() {
  const { toasts, removeToast } = useToast()

  return (
    <>
      <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Suspense fallback={<PageFallback />}>
          <Routes>
            <Route path="/"         element={<LandingPage />} />
            <Route path="/features" element={<LandingPage />} />
            <Route path="/pricing"  element={<LandingPage />} />
            <Route path="/faq"      element={<LandingPage />} />
            <Route path="/login"    element={<Login />} />
            <Route path="/signup"   element={<Signup />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/privacy"  element={<PrivacyPage />} />
            <Route path="/terms"    element={<TermsPage />} />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Layout />
                </ProtectedRoute>
              }
            >
              <Route index                      element={<Dashboard />} />
              <Route path="create-invoice"      element={<CreateInvoice />} />
              <Route path="edit-invoice/:id"    element={<CreateInvoice />} />
              <Route path="invoices"            element={<InvoicesPage />} />
              <Route path="purchase-bills"      element={<PurchaseBillsPage />} />
              <Route path="create-purchase-bill" element={<CreatePurchaseBill />} />
              <Route path="edit-purchase-bill/:id" element={<CreatePurchaseBill />} />
              <Route path="ledgers"             element={<LedgersPage />} />
              <Route path="gst-reports"         element={<GSTReports />} />
              <Route path="analytics"           element={<Analytics />} />
              <Route path="profile"             element={<Profile />} />
            </Route>
          </Routes>
        </Suspense>
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
