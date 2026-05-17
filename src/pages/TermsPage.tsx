import { ArrowLeft } from 'lucide-react';
import { Logo } from '@/components/layout/Logo';
import { useEffect } from 'react';

export default function TermsPage({ onBack }: { onBack: () => void }) {
  useEffect(() => {
    document.title = 'Terms of Service · CoreControl';
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
        <h1 className="text-4xl font-black tracking-tight mb-2">Terms of Service</h1>
        <p className="text-muted-foreground mb-12">Last Updated: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>

        <div className="space-y-10 text-muted-foreground leading-relaxed">
          
          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-foreground">1. Who the agreement is with</h2>
            <p>
              These Terms of Service ("Terms") constitute a legally binding agreement made between you, whether personally or on behalf of an entity ("Customer", "you", "your"), and CoreControl ("Company", "we", "us", or "our"), concerning your access to and use of the CoreControl application.
            </p>
            <p>
              <strong>Important:</strong> The Customer under these terms is the gaming cafe business or entity utilizing the software, not the individual gamers or patrons. By signing up or using CoreControl on behalf of a business, you represent and warrant that you have the legal authority to bind that business to these Terms.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-foreground">2. What the software does and doesn't do</h2>
            <p>
              CoreControl is a cloud-based Software as a Service (SaaS) designed to help gaming cafes manage their daily operations. Features include session time tracking, basic automated billing, seat/station management, and inventory tracking.
            </p>
            <p>
              While we strive to provide an exceptional product, we <strong>do not guarantee</strong> that the software will be universally compatible with every cafe setup, network configuration, hardware system, or operating system. CoreControl is not a local point-of-sale hardware system and relies on continuous internet connectivity.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-foreground">3. "As-is" Warranty Disclaimer</h2>
            <p className="uppercase text-sm font-bold tracking-wide">
              THE SOFTWARE IS PROVIDED ON AN "AS-IS" AND "AS-AVAILABLE" BASIS.
            </p>
            <p>
              To the maximum extent permitted by applicable law, we expressly disclaim all warranties, whether express, implied, statutory, or otherwise, including but not limited to the implied warranties of merchantability, fitness for a particular purpose, and non-infringement. 
            </p>
            <p>
              We are a solo-developed platform. We do not warrant that the software will be completely free of bugs, completely secure, or that operations will be uninterrupted with zero downtime. You acknowledge that your use of the software is at your sole risk.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-foreground">4. Limitation of Liability</h2>
            <p>
              Under no circumstances shall CoreControl or its developers be liable for any indirect, consequential, incidental, special, or punitive damages, including but not limited to lost profits, lost revenue, lost data, or business interruption arising out of your use or inability to use the software.
            </p>
            <p>
              <strong>Liability Cap:</strong> Our total aggregate liability to you for any claims arising out of or relating to these Terms or your use of the software is strictly limited to the total amount you paid to us for the software during the three (3) month period immediately preceding the event giving rise to the liability. If you are using a free trial or a free tier, our liability is completely capped at zero ($0).
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-foreground">5. Acceptable Use</h2>
            <p>
              You agree to use CoreControl solely for your internal business operations. You explicitly agree that you shall not:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>License, sublicense, sell, resell, transfer, assign, or distribute the software to any third party.</li>
              <li>Reverse-engineer, decompile, disassemble, or attempt to derive the source code of the software.</li>
              <li>Use the software to facilitate any illegal or unauthorized activities, including unlawful gambling operations.</li>
              <li>Attempt to bypass or break any security mechanism on the platform.</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-foreground">6. Account Responsibility</h2>
            <p>
              As the cafe owner or primary account holder, you are entirely responsible for maintaining the confidentiality of your account credentials. Furthermore, you are strictly responsible for all activities that occur under your account, including actions taken by your employees, staff, or any third party you grant access to.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-foreground">7. Payment Terms</h2>
            <p>
              CoreControl may be offered on a subscription basis. By subscribing, you agree to pay the stated fees associated with your chosen plan. All payments are securely processed by third-party payment providers.
            </p>
            <p>
              <strong>Failure to Pay:</strong> If a payment fails or an invoice becomes past due, we reserve the right to suspend or terminate your access to the software until full payment is received.
            </p>
            <p>
              <strong>Refunds:</strong> All payments made are non-refundable. We do not provide prorated refunds for partial months or unused periods of your subscription.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-foreground">8. Termination</h2>
            <p>
              You may terminate or cancel your account at any time. Upon cancellation, you will retain access to the software until the end of your current billing cycle. 
            </p>
            <p>
              We reserve the right, at our sole discretion, to suspend or terminate your account immediately and without prior notice if we determine that you have violated these Terms or engaged in any activity that harms our systems or other users.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-foreground">9. Updates and Changes</h2>
            <p>
              We are constantly improving CoreControl. We reserve the right to modify, add, or remove features of the software at any time. Furthermore, we may update our pricing or modify these Terms of Service. If we make material changes to these Terms, we will provide you with reasonable notice (e.g., via email or an in-app notification). Your continued use of the software after such changes constitutes your acceptance of the updated Terms.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-foreground">10. Governing Law</h2>
            <p>
              These Terms shall be governed by and construed in accordance with the laws of India. Any legal action or proceeding arising out of or related to these Terms shall be brought exclusively in the competent courts located within India, and you hereby consent to the personal jurisdiction of such courts.
            </p>
          </section>

          <div className="pt-8 mt-12 border-t border-border/50 text-sm">
            <p>If you have any questions or concerns regarding these Terms, please contact us at mecnoble132@gmail.com.</p>
          </div>
        </div>
      </main>
    </div>
  );
}
