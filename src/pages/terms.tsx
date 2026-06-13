"use client"

import { useState, useEffect } from "react"
import { Link } from "react-router-dom"
import { Receipt, ArrowLeft, Scale } from "lucide-react"

const sections = [
  {
    id: "acceptance",
    title: "Acceptance of Terms",
    paragraphs: [
      "By creating an EzBill account, accessing our website, or using any part of our service, you acknowledge that you have read, understood, and agree to be bound by these Terms of Service and our Privacy Policy.",
      "If you are using EzBill on behalf of a business, organization, or other legal entity, you represent and warrant that you have the authority to bind that entity to these terms. In such cases, \"you\" refers to both you individually and the entity you represent.",
      "We reserve the right to modify these terms at any time. Material changes will be communicated via email or in-app notification at least 14 days before they take effect. Continued use of EzBill after such changes constitutes your acceptance of the revised terms."
    ]
  },
  {
    id: "account",
    title: "Your Account",
    paragraphs: [
      "To use EzBill, you must create an account with a valid email address and a secure password. You are responsible for maintaining the confidentiality of your login credentials and for all activities that occur under your account.",
      "You agree to provide accurate, current, and complete information during registration and to keep your profile information updated. Providing false or misleading information may result in account suspension.",
      "You must notify us immediately at support@ezbill.app if you suspect any unauthorized access to or use of your account. EzBill is not liable for any loss or damage arising from your failure to protect your credentials."
    ]
  },
  {
    id: "service",
    title: "The Service",
    paragraphs: [
      "EzBill is a cloud-based invoicing and billing management platform. The service enables you to create and manage invoices, track purchase bills, maintain client ledger records, generate GST reports, and export financial data.",
      "EzBill is a tool for business record-keeping and document generation. It is not a substitute for professional accounting, tax, or legal advice. You are solely responsible for ensuring that your invoices and tax calculations comply with applicable laws and regulations.",
      "We provide the service on an \"as is\" and \"as available\" basis. While we strive for high availability, we do not guarantee that EzBill will be uninterrupted, error-free, or free from harmful components. Planned maintenance windows will be communicated in advance when feasible."
    ]
  },
  {
    id: "acceptable-use",
    title: "Acceptable Use",
    paragraphs: [
      "You may use EzBill only for lawful business purposes. You must not use EzBill to create fraudulent, misleading, or deceptive invoices or financial documents, or to facilitate any illegal activity including tax evasion or money laundering.",
      "You must not attempt to reverse-engineer, decompile, disassemble, or extract the source code of EzBill. You must not use automated tools (bots, crawlers, scrapers) to access the service without our prior written consent.",
      "You must not intentionally overload, disrupt, or degrade EzBill's systems or infrastructure, or attempt to gain unauthorized access to other users' accounts or data. Violation of these rules may result in immediate account termination."
    ]
  },
  {
    id: "your-data",
    title: "Your Content & Data",
    paragraphs: [
      "You retain full ownership of all content you create within EzBill, including invoices, purchase bills, client information, business details, and uploaded assets (logos, signatures). EzBill does not claim any intellectual property rights over your content.",
      "By using EzBill, you grant us a limited, non-exclusive license to store, process, and display your content solely for the purpose of providing and improving the service. This license terminates when you delete your content or close your account.",
      "You are responsible for maintaining independent backups of your critical business data. While we implement robust data protection measures, we strongly recommend exporting your data regularly using the built-in CSV export functionality."
    ]
  },
  {
    id: "pricing",
    title: "Pricing & Billing",
    paragraphs: [
      "EzBill offers a free tier with limited features and a Pro tier with expanded capabilities. Current pricing is displayed on our website and within the app. We may change our pricing at any time, with at least 30 days' notice to existing subscribers.",
      "Pro subscriptions are billed on a monthly or annual basis, depending on the billing cycle you select. All fees are stated in the applicable currency and are exclusive of any applicable taxes unless otherwise specified.",
      "Payments are non-refundable except where required by applicable consumer protection law. If you cancel a Pro subscription, you will retain access to Pro features until the end of your current billing period, after which your account will revert to the free tier."
    ]
  },
  {
    id: "liability",
    title: "Limitation of Liability",
    paragraphs: [
      "To the maximum extent permitted by law, EzBill and its team shall not be liable for any indirect, incidental, special, consequential, or punitive damages, including but not limited to loss of profits, revenue, data, or business opportunities, arising from your use of or inability to use the service.",
      "Our total aggregate liability for any claims arising from these terms or the service shall not exceed the total amount you paid to EzBill in the twelve (12) months immediately preceding the event giving rise to the claim, or ₹5,000 (whichever is greater).",
      "EzBill is not responsible for errors in tax calculations, GST filings, or financial reports that result from incorrect data input by the user. You acknowledge that it is your responsibility to verify all generated documents before submission to authorities or clients."
    ]
  },
  {
    id: "termination",
    title: "Termination",
    paragraphs: [
      "You may close your account at any time by contacting support@ezbill.app or through your account settings. Upon closure, your access to EzBill will be revoked, and data will be handled according to our Privacy Policy's retention schedule.",
      "We may suspend or terminate your account immediately, without prior notice, if we reasonably believe you have violated these terms, engaged in fraudulent activity, or pose a risk to other users or our infrastructure.",
      "Sections of these terms that by their nature should survive termination — including ownership, liability limitations, indemnification, and dispute resolution — will remain in full force and effect after your account is closed."
    ]
  },
  {
    id: "governing-law",
    title: "Governing Law",
    paragraphs: [
      "These Terms of Service are governed by and construed in accordance with the laws of India, without regard to its conflict-of-law principles.",
      "Any dispute arising from or relating to these terms or your use of EzBill shall first be attempted to be resolved through good-faith negotiation. If negotiation fails, the dispute shall be submitted to binding arbitration under the Arbitration and Conciliation Act, 1996, conducted in English.",
      "Nothing in these terms is intended to limit any rights you may have under applicable consumer protection or data privacy legislation that cannot be waived by contract."
    ]
  }
]

const TermsPage = () => {
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
    <div className="min-h-screen bg-white dark:bg-[#0F0F11] text-gray-900 dark:text-gray-100 transition-colors duration-300">
      {/* Header */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-white/80 dark:bg-[#0F0F11]/80 border-b border-gray-100 dark:border-white/[0.06]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <div className="w-7 h-7 bg-gradient-to-br from-emerald-500 to-green-600 rounded-lg flex items-center justify-center">
              <Receipt className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="font-bold text-gray-900 dark:text-white">EzBill</span>
          </Link>
          <Link to="/" className="flex items-center gap-1.5 text-xs font-medium text-gray-500 dark:text-[#A0A0AB] hover:text-gray-900 dark:hover:text-white transition-colors group">
            <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
            Home
          </Link>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Hero */}
        <div className="pt-12 sm:pt-20 pb-10 sm:pb-14 border-b border-gray-100 dark:border-white/[0.06]">
          <div className="flex items-center gap-2 mb-4">
            <Scale className="w-5 h-5 text-violet-500" />
            <span className="text-xs font-semibold uppercase tracking-widest text-violet-600 dark:text-violet-400">
              Terms of Service
            </span>
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-gray-900 dark:text-white mb-4 leading-[1.1]">
            Terms & conditions
          </h1>
          <p className="text-base sm:text-lg text-gray-500 dark:text-[#A0A0AB] max-w-2xl leading-relaxed">
            These terms govern your use of EzBill. Please read them carefully before creating an account or using our invoicing platform.
          </p>
          <p className="text-xs text-gray-400 dark:text-[#62626B] mt-4 font-medium">
            Last updated — {new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
          </p>
        </div>

        {/* Body — sidebar + content */}
        <div className="flex gap-12 lg:gap-16 py-10 sm:py-14">
          {/* Sidebar — Table of Contents */}
          <nav className="hidden lg:block w-56 shrink-0 sticky top-20 self-start">
            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-[#62626B] mb-3">On this page</p>
            <ul className="space-y-0.5">
              {sections.map(s => (
                <li key={s.id}>
                  <a
                    href={`#${s.id}`}
                    className={`block px-3 py-1.5 rounded-lg text-[13px] font-medium transition-all duration-200 ${
                      activeSection === s.id
                        ? "text-violet-600 dark:text-violet-400 bg-violet-50 dark:bg-violet-500/8"
                        : "text-gray-500 dark:text-[#62626B] hover:text-gray-900 dark:hover:text-[#A0A0AB]"
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
                className={`${i > 0 ? "mt-12 pt-12 border-t border-gray-100 dark:border-white/[0.05]" : ""}`}
              >
                <div className="flex items-baseline gap-3 mb-5">
                  <span className="text-xs font-bold text-violet-400 dark:text-violet-500 tabular-nums">{String(i + 1).padStart(2, "0")}</span>
                  <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white tracking-tight">
                    {section.title}
                  </h2>
                </div>
                <div className="space-y-4">
                  {section.paragraphs.map((p, j) => (
                    <p key={j} className="text-[15px] leading-[1.75] text-gray-600 dark:text-[#A0A0AB]">
                      {p}
                    </p>
                  ))}
                </div>
              </section>
            ))}

            {/* Contact */}
            <div className="mt-16 p-6 sm:p-8 rounded-2xl bg-gray-50 dark:bg-[#161618] border border-gray-100 dark:border-white/[0.06]">
              <p className="text-sm font-bold text-gray-900 dark:text-white mb-1.5">Have questions about these terms?</p>
              <p className="text-sm text-gray-500 dark:text-[#A0A0AB] mb-3">
                We're happy to clarify anything. Our team typically responds within 24 hours.
              </p>
              <a
                href="mailto:support@ezbill.app"
                className="text-sm font-semibold text-emerald-600 dark:text-emerald-400 hover:underline underline-offset-2"
              >
                support@ezbill.app →
              </a>
            </div>
          </article>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-gray-100 dark:border-white/[0.06] py-6 mt-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between text-xs text-gray-400 dark:text-[#62626B]">
          <span>© {new Date().getFullYear()} EzBill. All rights reserved.</span>
          <div className="flex gap-6">
            <Link to="/terms" className="text-gray-900 dark:text-white font-medium">Terms</Link>
            <Link to="/privacy" className="hover:text-gray-900 dark:hover:text-white transition-colors">Privacy</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default TermsPage
