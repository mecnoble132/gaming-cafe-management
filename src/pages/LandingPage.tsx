import { Button } from '@/components/ui/button';
import { Logo } from '@/components/layout/Logo';
import { ArrowRight, BarChart3, CheckCircle2, Gamepad2, LayoutDashboard, MonitorPlay, Users } from 'lucide-react';
import { useEffect } from 'react';

import imgDashboard from '@/assets/dashboard.png';
import imgBooking from '@/assets/booking.png';
import imgBilling from '@/assets/billing.png';
import imgReports from '@/assets/reports.png';

export default function LandingPage({ onStart, onShowTerms, onShowPrivacy }: { onStart: (isSignUp: boolean) => void; onShowTerms?: () => void; onShowPrivacy?: () => void }) {
  useEffect(() => { document.title = 'CoreControl · Gaming Cafe Management'; }, []);
  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-primary/30 font-sans">
      {/* Navigation */}
      <nav className="fixed top-0 inset-x-0 z-50 flex items-center justify-between px-6 py-4 bg-background/80 backdrop-blur-xl border-b border-border/50">
        <Logo size="md" />
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => onStart(false)}>Log In</Button>
          <Button onClick={() => onStart(true)}>Start Free Trial</Button>
        </div>
      </nav>

      <main className="pt-24 sm:pt-32">
        {/* 1. Hero Section */}
        <section className="px-6 py-12 md:py-20 max-w-5xl mx-auto text-center">
          <div className="inline-block mb-4 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-semibold tracking-wide uppercase">
            The New Standard in Cafe Management
          </div>
          <h1 className="text-4xl md:text-6xl font-black tracking-tight mb-6 text-foreground leading-[1.1]">
            Take complete control of your <br className="hidden md:block" /> gaming cafe.
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground mb-10 max-w-2xl mx-auto">
            Stop juggling spreadsheets and manual timers. CoreControl automates billing, tracks inventory, and manages customer loyalty—all from one beautiful dashboard.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button size="lg" className="h-14 px-8 text-base font-semibold w-full sm:w-auto shadow-lg shadow-primary/25" onClick={() => onStart(true)}>
              Start 7-Day Free Trial
            </Button>
            <span className="text-xs text-muted-foreground font-medium">No credit card required</span>
          </div>

          <div className="mt-16 md:mt-24 relative mx-auto w-full max-w-5xl rounded-xl border border-border/50 shadow-2xl p-2 md:p-4 bg-muted/20 flex items-center justify-center overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent z-10 pointer-events-none" />
            <img src={imgDashboard} alt="CoreControl Dashboard" className="w-full h-auto rounded-lg border border-border shadow-xl transform transition-transform duration-700 group-hover:scale-[1.01]" />
          </div>
        </section>

        {/* 2. Problem Section */}
        <section className="px-6 py-24 bg-muted/10 border-y border-border/50">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-2xl md:text-4xl font-bold mb-12">Running a gaming cafe is chaos without the right tools.</h2>
            <div className="grid sm:grid-cols-3 gap-8 text-left">
              <div className="p-6 rounded-2xl bg-background border border-border/50 shadow-sm">
                <div className="h-10 w-10 rounded-full bg-red-500/10 flex items-center justify-center text-red-500 mb-4">
                  <MonitorPlay size={20} />
                </div>
                <h3 className="font-semibold mb-2">Manual time tracking is exhausting</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">Constantly watching the clock and arguing with customers over expired sessions.</p>
              </div>
              <div className="p-6 rounded-2xl bg-background border border-border/50 shadow-sm">
                <div className="h-10 w-10 rounded-full bg-red-500/10 flex items-center justify-center text-red-500 mb-4">
                  <BarChart3 size={20} />
                </div>
                <h3 className="font-semibold mb-2">Revenue slips through the cracks</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">Unrecorded snacks, messy ledgers, and no clear way to see if you actually made a profit today.</p>
              </div>
              <div className="p-6 rounded-2xl bg-background border border-border/50 shadow-sm">
                <div className="h-10 w-10 rounded-full bg-red-500/10 flex items-center justify-center text-red-500 mb-4">
                  <Users size={20} />
                </div>
                <h3 className="font-semibold mb-2">Customer loyalty is non-existent</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">No system to reward your best players, making it hard to keep them coming back.</p>
              </div>
            </div>
          </div>
        </section>

        {/* 3. Features Section */}
        <section className="px-6 py-24 max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Everything you need. Nothing you don't.</h2>
            <p className="text-muted-foreground">Built specifically for modern gaming lounges and esports arenas.</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="p-6">
              <Gamepad2 className="text-primary mb-4" size={32} />
              <h3 className="text-lg font-bold mb-2">Smart Station Booking</h3>
              <p className="text-muted-foreground text-sm">Visual timeline to easily manage PC, PS5, and VR bookings without double-booking.</p>
            </div>
            <div className="p-6">
              <LayoutDashboard className="text-primary mb-4" size={32} />
              <h3 className="text-lg font-bold mb-2">Automated Billing</h3>
              <p className="text-muted-foreground text-sm">Pre-paid or post-paid. Automatically calculate costs based on dynamic hourly rates.</p>
            </div>
            <div className="p-6">
              <CheckCircle2 className="text-primary mb-4" size={32} />
              <h3 className="text-lg font-bold mb-2">Inventory Management</h3>
              <p className="text-muted-foreground text-sm">Track energy drinks, snacks, and merch. Get alerts when stock runs low.</p>
            </div>
            <div className="p-6">
              <Users className="text-primary mb-4" size={32} />
              <h3 className="text-lg font-bold mb-2">Built-in Loyalty System</h3>
              <p className="text-muted-foreground text-sm">Reward points for every minute played. Keep customers addicted to your cafe.</p>
            </div>
            <div className="p-6">
              <BarChart3 className="text-primary mb-4" size={32} />
              <h3 className="text-lg font-bold mb-2">Detailed Analytics</h3>
              <p className="text-muted-foreground text-sm">Know your most profitable days, top customers, and bestselling inventory items.</p>
            </div>
          </div>
        </section>

        {/* 4. Screenshots / Walkthrough */}
        <section className="py-24 bg-muted/10 border-y border-border/50 overflow-hidden">
          <div className="max-w-6xl mx-auto px-6">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">See CoreControl in action</h2>
              <p className="text-muted-foreground">A clean, dark-mode interface designed for high-speed operations.</p>
            </div>

            <div className="space-y-24">
              {/* Feature 1 */}
              <div className="grid md:grid-cols-2 gap-12 items-center">
                <div className="order-2 md:order-1 rounded-xl border border-border/50 bg-background/50 flex items-center justify-center shadow-xl overflow-hidden group p-2">
                  <img src={imgBooking} alt="Bookings Timeline" className="w-full h-auto object-contain rounded-lg border border-border/50 transform transition-transform duration-700 group-hover:scale-[1.02]" />
                </div>
                <div className="order-1 md:order-2">
                  <h3 className="text-2xl font-bold mb-4">Flawless Session Management</h3>
                  <p className="text-muted-foreground mb-6">See exactly which stations are active, when they end, and what's coming up next on a beautiful, interactive timeline.</p>
                  <ul className="space-y-3">
                    <li className="flex items-center gap-3 text-sm"><CheckCircle2 className="text-primary" size={16} /> Drag and drop interface</li>
                    <li className="flex items-center gap-3 text-sm"><CheckCircle2 className="text-primary" size={16} /> Live progress indicators</li>
                    <li className="flex items-center gap-3 text-sm"><CheckCircle2 className="text-primary" size={16} /> Instant conflict prevention</li>
                  </ul>
                </div>
              </div>

              {/* Feature 2 */}
              <div className="grid md:grid-cols-2 gap-12 items-center">
                <div>
                  <h3 className="text-2xl font-bold mb-4">Lightning Fast Billing</h3>
                  <p className="text-muted-foreground mb-6">Convert completed sessions directly into bills. Add snacks and drinks with one click.</p>
                  <ul className="space-y-3">
                    <li className="flex items-center gap-3 text-sm"><CheckCircle2 className="text-primary" size={16} /> Automatic time calculation</li>
                    <li className="flex items-center gap-3 text-sm"><CheckCircle2 className="text-primary" size={16} /> Quick inventory add-ons</li>
                    <li className="flex items-center gap-3 text-sm"><CheckCircle2 className="text-primary" size={16} /> Split payment support</li>
                  </ul>
                </div>
                <div className="rounded-xl border border-border/50 bg-background/50 flex items-center justify-center shadow-xl overflow-hidden group p-2">
                  <img src={imgBilling} alt="Billing Interface" className="w-full h-auto object-contain rounded-lg border border-border/50 transform transition-transform duration-700 group-hover:scale-[1.02]" />
                </div>
              </div>

              {/* Feature 3 */}
              <div className="grid md:grid-cols-2 gap-12 items-center">
                <div className="order-2 md:order-1 rounded-xl border border-border/50 bg-background/50 flex items-center justify-center shadow-xl overflow-hidden group p-2">
                  <img src={imgReports} alt="Analytics Dashboard" className="w-full h-auto object-contain rounded-lg border border-border/50 transform transition-transform duration-700 group-hover:scale-[1.02]" />
                </div>
                <div className="order-1 md:order-2">
                  <h3 className="text-2xl font-bold mb-4">Actionable Insights</h3>
                  <p className="text-muted-foreground mb-6">Stop guessing. Get visual charts on your revenue trends, top-selling items, and peak cafe hours.</p>
                  <ul className="space-y-3">
                    <li className="flex items-center gap-3 text-sm"><CheckCircle2 className="text-primary" size={16} /> Revenue trend charts</li>
                    <li className="flex items-center gap-3 text-sm"><CheckCircle2 className="text-primary" size={16} /> Customer growth metrics</li>
                    <li className="flex items-center gap-3 text-sm"><CheckCircle2 className="text-primary" size={16} /> Exportable data</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 5. How It Works */}
        <section className="px-6 py-24 max-w-5xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-16">Up and running in minutes</h2>
          <div className="grid md:grid-cols-3 gap-8 relative">
            <div className="hidden md:block absolute top-12 left-[20%] right-[20%] h-0.5 bg-border/50" />
            
            <div className="relative z-10 flex flex-col items-center">
              <div className="w-24 h-24 rounded-2xl bg-background border border-border shadow-lg flex items-center justify-center text-3xl font-black mb-6 text-primary">1</div>
              <h3 className="text-xl font-bold mb-2">Sign Up</h3>
              <p className="text-muted-foreground text-sm">Create your free account. No credit card required.</p>
            </div>
            
            <div className="relative z-10 flex flex-col items-center">
              <div className="w-24 h-24 rounded-2xl bg-background border border-border shadow-lg flex items-center justify-center text-3xl font-black mb-6 text-primary">2</div>
              <h3 className="text-xl font-bold mb-2">Set Up Your Cafe</h3>
              <p className="text-muted-foreground text-sm">Enter your stations, set your hourly rates, and add your inventory.</p>
            </div>

            <div className="relative z-10 flex flex-col items-center">
              <div className="w-24 h-24 rounded-2xl bg-background border border-border shadow-lg flex items-center justify-center text-3xl font-black mb-6 text-primary">3</div>
              <h3 className="text-xl font-bold mb-2">Start Managing</h3>
              <p className="text-muted-foreground text-sm">Book sessions, generate bills, and watch your business grow.</p>
            </div>
          </div>
        </section>

        {/* 6. Pricing Section */}
        <section className="px-6 py-24 bg-muted/10 border-y border-border/50">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Simple, transparent pricing</h2>
            <p className="text-muted-foreground mb-12">One plan. All features. Grow your business without limits.</p>

            <div className="max-w-md mx-auto bg-background rounded-3xl border border-border/50 shadow-2xl overflow-hidden text-left">
              <div className="p-8 border-b border-border/50">
                <h3 className="text-xl font-bold mb-2">CoreControl Pro</h3>
                <div className="flex items-baseline gap-2 mb-2">
                  <span className="text-5xl font-black tracking-tight">₹499</span>
                  <span className="text-muted-foreground">/ month</span>
                </div>
                <p className="text-sm text-muted-foreground">Everything you need to run your arena flawlessly.</p>
              </div>
              <div className="p-8 bg-muted/5 space-y-6">
                <ul className="space-y-4">
                  <li className="flex items-center gap-3"><CheckCircle2 className="text-primary" size={18} /> Unlimited Stations</li>
                  <li className="flex items-center gap-3"><CheckCircle2 className="text-primary" size={18} /> Unlimited Bookings</li>
                  <li className="flex items-center gap-3"><CheckCircle2 className="text-primary" size={18} /> Inventory & Stock Alerts</li>
                  <li className="flex items-center gap-3"><CheckCircle2 className="text-primary" size={18} /> Customer Loyalty Program</li>
                  <li className="flex items-center gap-3"><CheckCircle2 className="text-primary" size={18} /> Advanced Analytics</li>
                </ul>
                <div className="pt-4">
                  <Button size="lg" className="w-full h-12 text-base font-bold shadow-lg shadow-primary/20" onClick={() => onStart(true)}>
                    Start 7-Day Free Trial
                  </Button>
                  <p className="text-center text-xs text-muted-foreground mt-3">No credit card required.</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 7. FAQ */}
        <section className="px-6 py-24 max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">Frequently Asked Questions</h2>
          <div className="space-y-8">
            <div>
              <h4 className="text-lg font-semibold mb-2">Is it hard to set up?</h4>
              <p className="text-muted-foreground">Not at all. Our 3-step onboarding process takes less than 5 minutes. You just enter your cafe name, station types, and prices, and you're ready to go.</p>
            </div>
            <div>
              <h4 className="text-lg font-semibold mb-2">What happens after the trial?</h4>
              <p className="text-muted-foreground">At the end of your 7-day trial, you can choose to subscribe to our Pro plan. If you decide not to, your data will be securely held for 30 days before being deleted.</p>
            </div>
            <div>
              <h4 className="text-lg font-semibold mb-2">Who is this for?</h4>
              <p className="text-muted-foreground">CoreControl is built specifically for gaming cafes, esports lounges, VR arcades, and internet cafes that charge by the hour and sell snacks/drinks.</p>
            </div>
            <div>
              <h4 className="text-lg font-semibold mb-2">Is my data safe?</h4>
              <p className="text-muted-foreground">Yes. We use enterprise-grade encryption and secure cloud infrastructure to ensure your revenue and customer data is always protected and backed up.</p>
            </div>
          </div>
        </section>

        {/* 8. Final CTA */}
        <section className="px-6 py-24">
          <div className="max-w-4xl mx-auto bg-gradient-to-br from-primary/20 to-background border border-primary/20 rounded-3xl p-10 md:p-16 text-center shadow-2xl shadow-primary/5">
            <h2 className="text-3xl md:text-5xl font-black tracking-tight mb-6">Ready to upgrade your cafe?</h2>
            <p className="text-lg text-muted-foreground mb-10 max-w-xl mx-auto">
              Join the growing number of cafe owners who have ditched the spreadsheets and leveled up their operations.
            </p>
            <Button size="lg" className="h-14 px-10 text-base font-bold shadow-lg shadow-primary/20 group" onClick={() => onStart(true)}>
              Start Your Free Trial <ArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" size={18} />
            </Button>
            <p className="text-xs text-muted-foreground mt-4">7 days free • No credit card required • Cancel anytime</p>
          </div>
        </section>
      </main>

      {/* 9. Footer */}
      <footer className="border-t border-border/50 py-12 px-6 bg-muted/5 text-sm text-muted-foreground">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="col-span-1 md:col-span-2">
            <Logo size="sm" className="mb-4 grayscale opacity-70" />
            <p className="max-w-xs">The modern operating system for gaming cafes and esports lounges worldwide.</p>
          </div>
          <div>
            <h4 className="font-semibold text-foreground mb-4">Legal</h4>
            <ul className="space-y-2">
              <li><button onClick={() => onShowPrivacy?.()} className="hover:text-foreground transition-colors">Privacy Policy</button></li>
              <li><button onClick={() => onShowTerms?.()} className="hover:text-foreground transition-colors">Terms of Service</button></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-foreground mb-4">Contact</h4>
            <ul className="space-y-2">
              <li><a href="mailto:mecnoble132@gmail.com" className="hover:text-foreground transition-colors">mecnoble132@gmail.com</a></li>
            </ul>
          </div>
        </div>
        <div className="max-w-6xl mx-auto mt-12 pt-8 border-t border-border/20 text-xs text-center md:text-left">
          &copy; {new Date().getFullYear()} CoreControl SaaS. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
