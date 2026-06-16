"use client"

import { useState, useEffect } from "react"
import { Link } from "react-router-dom"
import { Receipt, ArrowLeft, Shield } from "lucide-react"

const sections = [
  {
    id: "info-collect",
    title: "Information We Collect",
    paragraphs: [
      "When you sign up for EzBill, we collect your name, email address, and password. During profile setup, you may optionally provide business details such as your GST number, PAN, bank account information, business address, and phone number.",
      "As you use EzBill, we store the invoices, purchase bills, client ledger entries, and GST reports you create. This includes customer names, line items, tax calculations, amounts, and payment statuses.",
      "We automatically collect usage analytics (pages viewed, features used, session duration), device information (browser type, operating system), and IP addresses to improve service quality and security."
    ]
  },
  {
    id: "how-we-use",
    title: "How We Use Your Data",
    paragraphs: [
      "Your business data is used solely to power EzBill's core features — generating invoices, calculating GST, producing reports, and maintaining client ledger histories. We never use your financial data for advertising or sell it to third parties.",
      "Account information (email, name) is used for authentication, sending critical service notifications, and providing customer support. We may also send product updates which you can opt out of at any time.",
      "Aggregated, anonymized usage data helps us understand which features are most valuable, identify performance bottlenecks, and prioritize our product roadmap. This data cannot be traced back to individual users."
    ]
  },
  {
    id: "data-security",
    title: "Security & Encryption",
    paragraphs: [
      "All data transmitted between your browser and EzBill servers is encrypted using TLS 1.3. Data stored in our Firebase/Google Cloud infrastructure is encrypted at rest using AES-256 encryption.",
      "Authentication is handled through Firebase Authentication with secure, short-lived JWT tokens. Passwords are never stored in plain text — they are hashed using industry-standard bcrypt algorithms managed by Google's authentication infrastructure.",
      "We enforce strict Firestore security rules ensuring users can only access their own data. Our infrastructure undergoes regular security reviews, and access to production systems is limited to essential personnel with multi-factor authentication."
    ]
  },
  {
    id: "third-parties",
    title: "Third-Party Services",
    paragraphs: [
      "EzBill is built on Google's Firebase platform, which provides authentication, database (Cloud Firestore), and hosting services. Google's infrastructure complies with SOC 1/2/3, ISO 27001, and other industry certifications.",
      "We use Cloudinary for image storage (business logos, signatures) with secure, authenticated access. No other third-party services have access to your business or financial data.",
      "We do not integrate with any advertising networks, data brokers, or marketing platforms. We do not place tracking pixels from third parties on any EzBill page."
    ]
  },
  {
    id: "your-rights",
    title: "Your Rights",
    paragraphs: [
      "You own your data. EzBill claims no ownership over the invoices, bills, reports, or any business information you create. Our license to process your data is limited to providing and improving the service.",
      "You can export all your data (invoices, reports, client information) at any time through the built-in CSV export functionality. You can update or correct any personal information through your Profile settings page.",
      "You may request complete deletion of your account and all associated data by contacting support@ezbill.app. Upon receiving a verified deletion request, we will remove your personal data within 30 days, except where legal retention requirements apply (e.g., financial records under Indian tax law may be retained for up to 7 years)."
    ]
  },
  {
    id: "cookies",
    title: "Cookies & Local Storage",
    paragraphs: [
      "EzBill uses essential cookies and local storage exclusively for authentication sessions, theme preferences (light/dark mode), and application state. These are strictly necessary for the service to function.",
      "We do not use advertising cookies, cross-site tracking cookies, or any third-party cookies. We do not participate in any cookie-based advertising networks or retargeting programs.",
      "Your browser settings allow you to control or delete cookies. However, disabling essential cookies may prevent EzBill from functioning correctly, as they are required for maintaining your login session."
    ]
  },
  {
    id: "data-retention",
    title: "Data Retention",
    paragraphs: [
      "Active account data is retained for as long as your account exists. If you cancel your subscription or stop using EzBill, your account and data remain accessible unless you explicitly request deletion.",
      "After an account deletion request, personal identifiers (name, email, phone) are removed within 30 days. Financial records (invoices, bills) may be retained in anonymized form for up to 7 years to comply with applicable tax regulations in India.",
      "Encrypted backup copies of data may persist in our disaster recovery systems for up to 90 days after deletion, after which they are permanently purged."
    ]
  },
  {
    id: "changes",
    title: "Changes to This Policy",
    paragraphs: [
      "We may update this Privacy Policy periodically to reflect changes in our practices, technology, legal requirements, or business operations. We will notify you of material changes through an in-app notification or email at least 14 days before they take effect.",
      "The \"Last updated\" date at the top of this page indicates when the policy was most recently revised. We encourage you to review this page periodically to stay informed about how we protect your data."
    ]
  }
]

const PrivacyPage = () => {
  const [activeSection, setActiveSection] = useState(sections[0].id)

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.find(e => e.isIntersecting)
        if (visible) setActiveSection(visible.target.id)
      },
      { rootMargin: "-20% 0px -60% 0px" }
    )

    sections.forEach(s => {
      const el = document.getElementById(s.id)
      if (el) observer.observe(el)
    })

    return () => observer.disconnect()
  }, [])

  return (
    <div className="min-h-screen bg-white dark:bg-[#0C0C0E] text-gray-900 dark:text-gray-100 transition-colors duration-300">
      {/* Header */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-white/80 dark:bg-[#0C0C0E]/80 border-b border-gray-100 dark:border-white/[0.04]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <div className="w-7 h-7 bg-blue-600 rounded-lg flex items-center justify-center">
              <Receipt className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="font-bold text-gray-900 dark:text-white">EzBill</span>
          </Link>
          <Link to="/" className="flex items-center gap-1.5 text-xs font-medium text-gray-500 dark:text-[#8B8B96] hover:text-gray-900 dark:hover:text-white transition-colors group">
            <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
            Home
          </Link>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Hero */}
        <div className="pt-12 sm:pt-20 pb-10 sm:pb-14 border-b border-gray-100 dark:border-white/[0.04]">
          <div className="flex items-center gap-2 mb-4">
            <Shield className="w-5 h-5 text-blue-500" />
            <span className="text-xs font-semibold uppercase tracking-widest text-blue-600 dark:text-blue-400">
              Privacy Policy
            </span>
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-gray-900 dark:text-white mb-4 leading-[1.1]">
            How we handle your data
          </h1>
          <p className="text-base sm:text-lg text-gray-500 dark:text-[#8B8B96] max-w-2xl leading-relaxed">
            Transparency is core to how we build EzBill. This policy explains exactly what data we collect, how we use it, and the controls you have.
          </p>
          <p className="text-xs text-gray-400 dark:text-[#55555E] mt-4 font-medium">
            Last updated — {new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
          </p>
        </div>

        {/* Body — sidebar + content */}
        <div className="flex gap-12 lg:gap-16 py-10 sm:py-14">
          {/* Sidebar — Table of Contents */}
          <nav className="hidden lg:block w-56 shrink-0 sticky top-20 self-start">
            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-[#55555E] mb-3">On this page</p>
            <ul className="space-y-0.5">
              {sections.map(s => (
                <li key={s.id}>
                  <a
                    href={`#${s.id}`}
                    className={`block px-3 py-1.5 rounded-lg text-[13px] font-medium transition-all duration-200 ${
                      activeSection === s.id
                        ? "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-500/8"
                        : "text-gray-500 dark:text-[#55555E] hover:text-gray-900 dark:hover:text-[#A0A0AB]"
                    }`}
                  >
                    {s.title}
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          {/* Content */}
          <article className="flex-1 min-w-0 max-w-3xl">
            {sections.map((section, i) => (
              <section
                key={section.id}
                id={section.id}
                className={`${i > 0 ? "mt-12 pt-12 border-t border-gray-100 dark:border-white/[0.03]" : ""}`}
              >
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-5 tracking-tight">
                  {section.title}
                </h2>
                <div className="space-y-4">
                  {section.paragraphs.map((p, j) => (
                    <p key={j} className="text-[15px] leading-[1.75] text-gray-600 dark:text-[#8B8B96]">
                      {p}
                    </p>
                  ))}
                </div>
              </section>
            ))}

            {/* Contact */}
            <div className="mt-16 p-6 sm:p-8 rounded-2xl bg-gray-50 dark:bg-[#141416] border border-gray-100 dark:border-white/[0.04]">
              <p className="text-sm font-bold text-gray-900 dark:text-white mb-1.5">Questions about your privacy?</p>
              <p className="text-sm text-gray-500 dark:text-[#8B8B96] mb-3">
                We're happy to clarify anything. Reach out anytime.
              </p>
              <a
                href="mailto:support@ezbill.app"
                className="text-sm font-semibold text-blue-600 dark:text-blue-400 hover:underline underline-offset-2"
              >
                support@ezbill.app →
              </a>
            </div>
          </article>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-gray-100 dark:border-white/[0.04] py-6 mt-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between text-xs text-gray-400 dark:text-[#55555E]">
          <span>© {new Date().getFullYear()} EzBill. All rights reserved.</span>
          <div className="flex gap-6">
            <Link to="/terms" className="hover:text-gray-900 dark:hover:text-white transition-colors">Terms</Link>
            <Link to="/privacy" className="text-gray-900 dark:text-white font-medium">Privacy</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default PrivacyPage
