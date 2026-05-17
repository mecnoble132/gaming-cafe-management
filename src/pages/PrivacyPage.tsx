import { ArrowLeft } from 'lucide-react';
import { Logo } from '@/components/layout/Logo';
import { useEffect } from 'react';

export default function PrivacyPage({ onBack }: { onBack: () => void }) {
  useEffect(() => {
    document.title = 'Privacy Policy · CoreControl';
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-primary/30 font-sans pb-24">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 flex items-center px-6 py-4 bg-background/80 backdrop-blur-xl border-b border-border/50">
        <button
          onClick={onBack}
          className="mr-6 flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft size={16} /> Back
        </button>
        <Logo size="md" />
      </nav>

      <main className="max-w-3xl mx-auto px-6 pt-12">
        <h1 className="text-4xl font-black tracking-tight mb-2">Privacy Policy</h1>
        <p className="text-muted-foreground mb-12">
          Last Updated: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
        </p>

        <div className="space-y-10 text-muted-foreground leading-relaxed">

          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-foreground">1. Introduction</h2>
            <p>
              CoreControl ("we", "us", or "our") is committed to protecting the privacy of the businesses and individuals who use our platform. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use CoreControl.
            </p>
            <p>
              By accessing or using our services, you agree to this Privacy Policy. If you do not agree, please discontinue your use of the platform immediately.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-foreground">2. Data We Collect About Cafe Owners</h2>
            <p>
              When you register and operate a CoreControl account, we collect the following information about you as the business operator:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Account Information:</strong> Your name, email address, and password (stored securely via Supabase Auth).</li>
              <li><strong>Business Information:</strong> Your cafe's name, slug/identifier, and any details you provide during onboarding such as your number of seats or gaming stations.</li>
              <li><strong>Billing Information:</strong> If a paid subscription is active, payment details are processed and stored by our third-party payment provider. We do not store raw credit card numbers on our servers.</li>
              <li><strong>Usage Data:</strong> Information about how you use the software, including features accessed, timestamps of actions, and application performance data.</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-foreground">3. Data About End Users (Gamers)</h2>
            <p>
              CoreControl is a business management tool, and you (the cafe owner) are the primary data controller for any information you enter about your customers. We act as a data processor on your behalf. Through normal operation of the software, the following gamer-related data may be stored on our systems:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Customer Profiles:</strong> Names, phone numbers, WhatsApp numbers, and loyalty points balances — as entered by cafe staff.</li>
              <li><strong>Session Logs:</strong> Session start/end times, gaming station used, game type, and duration per session.</li>
              <li><strong>Billing Records:</strong> Itemised bills associated with a customer, including items purchased, total amounts paid, and payment method.</li>
            </ul>
            <p>
              This data is logically isolated per cafe (tenant) and is not accessible to other cafes using our platform. We do not independently collect or use gamer data for our own marketing purposes. As the cafe operator, it is <strong>your responsibility</strong> to ensure you have appropriate consent from your customers to collect and store their information.
            </p>
            <p>
              <strong>Retention:</strong> Gamer session and billing data is retained for as long as your account is active. Upon account termination, all associated data is scheduled for deletion within <strong>90 days</strong>.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-foreground">4. Why We Collect Your Data</h2>
            <p>We collect and use your data strictly for the following purposes:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>To create and manage your account and provide the CoreControl service.</li>
              <li>To process subscription payments and send billing-related communications.</li>
              <li>To provide technical support and respond to your inquiries.</li>
              <li>To monitor system performance, fix bugs, and improve the platform.</li>
              <li>To comply with legal and regulatory obligations.</li>
            </ul>
            <p>We will never collect data that we cannot justify under one of the purposes listed above.</p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-foreground">5. Who We Share Your Data With</h2>
            <p>
              We do not sell, trade, or rent your personal data to any third party. We may share data only with trusted third-party service providers who assist us in operating the platform, and only to the extent necessary:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Supabase:</strong> Our cloud database and authentication provider. All application data is stored on Supabase's infrastructure. (<a href="https://supabase.com/privacy" target="_blank" rel="noreferrer" className="text-primary hover:underline">supabase.com/privacy</a>)</li>
              <li><strong>Google (Gemini API):</strong> Used for AI-powered features within the application. Relevant data sent to this API is governed by Google's privacy policy.</li>
              <li><strong>Payment Processors:</strong> If payment processing is enabled, your billing information is handled by our payment gateway provider.</li>
            </ul>
            <p>All third-party providers are contractually obligated to protect your data and are prohibited from using it for any purpose other than providing services to us.</p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-foreground">6. Data Retention</h2>
            <p>
              We retain your account and business data for as long as your subscription is active. If you cancel or your account is terminated, your data will remain accessible for a <strong>30-day grace period</strong>, after which it will be permanently and irreversibly deleted from our systems within <strong>90 days</strong> of the termination date.
            </p>
            <p>
              If required by law, certain records (e.g., financial transaction logs) may need to be retained for a longer statutory period, even after account closure.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-foreground">7. Security</h2>
            <p>
              We take data security seriously and implement reasonable technical and organisational measures to protect your information against unauthorised access, alteration, disclosure, or destruction. These measures include:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Encryption of data in transit using TLS/HTTPS.</li>
              <li>Database-level Row-Level Security (RLS) to ensure strict multi-tenant data isolation — your data is never visible to other cafes.</li>
              <li>Secure, hashed password storage via industry-standard authentication systems.</li>
            </ul>
            <p>
              <strong>However, no method of transmission or storage over the internet is 100% secure.</strong> We cannot guarantee absolute security, and you use the platform at your own risk.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-foreground">8. Your Rights</h2>
            <p>
              Depending on your location, you may have certain rights over your personal data. We honour the following rights for all users, including those protected under the <strong>EU General Data Protection Regulation (GDPR)</strong> and <strong>India's Digital Personal Data Protection Act, 2023 (DPDP Act)</strong>:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Right to Access:</strong> You can request a copy of the personal data we hold about you.</li>
              <li><strong>Right to Rectification:</strong> You can ask us to correct any inaccurate information we hold.</li>
              <li><strong>Right to Erasure:</strong> You can request that we delete your personal data. Note that certain data may need to be retained for legal or compliance reasons.</li>
              <li><strong>Right to Object:</strong> You can object to us processing your data in certain circumstances.</li>
              <li><strong>Right to Data Portability:</strong> You can request your data in a structured, machine-readable format.</li>
            </ul>
            <p>
              To exercise any of these rights, please contact us at the email address listed in Section 10 below. We will respond to all verifiable requests within 30 days.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-foreground">9. Cookies and Analytics</h2>
            <p>
              Our web application may use essential cookies to maintain your authenticated session. We do not use tracking or advertising cookies. If analytics tools are used on the CoreControl marketing website (e.g., to understand visitor behaviour), they will be listed here. Currently, we do not use any third-party analytics services on the public landing page beyond what is provided by our hosting infrastructure.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-foreground">10. Contact Information</h2>
            <p>
              If you have any questions, concerns, or requests relating to this Privacy Policy or how we handle your data, please contact us at:
            </p>
            <p>
              <strong>Email:</strong>{' '}
              <a href="mailto:mecnoble132@gmail.com" className="text-primary hover:underline">
                mecnoble132@gmail.com
              </a>
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-foreground">11. Changes to This Policy</h2>
            <p>
              We may update this Privacy Policy from time to time to reflect changes in our practices, technology, legal requirements, or other factors. When we make material changes, we will notify you via email or a prominent in-app notice at least <strong>14 days</strong> before the changes take effect.
            </p>
            <p>
              Your continued use of CoreControl after the effective date of the updated policy constitutes your acceptance of the changes.
            </p>
          </section>

          <div className="pt-8 mt-12 border-t border-border/50 text-sm">
            <p>This Privacy Policy is governed by the laws of India.</p>
          </div>
        </div>
      </main>
    </div>
  );
}
