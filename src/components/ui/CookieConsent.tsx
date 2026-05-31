import { useEffect, useState } from 'react';
import { Cookie, ShieldCheck, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface CookieConsentProps {
  onShowPrivacy: () => void;
  onShowTerms: () => void;
}

export function CookieConsent({ onShowPrivacy, onShowTerms }: CookieConsentProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Check local storage for consent status
    const consent = localStorage.getItem('corecontrol-cookie-consent');
    if (!consent) {
      // Delay showing the banner slightly for better UX/visual entry
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem('corecontrol-cookie-consent', 'accepted');
    setIsVisible(false);
  };

  const handleDecline = () => {
    localStorage.setItem('corecontrol-cookie-consent', 'declined');
    setIsVisible(false);
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 30, scale: 0.95 }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
          className="fixed bottom-6 inset-x-6 sm:left-auto sm:right-6 sm:max-w-md z-50"
        >
          {/* Glassmorphic Glowing Outer Container */}
          <div className="relative rounded-2xl border border-border/50 bg-background/70 p-5 backdrop-blur-xl shadow-[0_10px_40px_rgba(0,0,0,0.4)] overflow-hidden">
            
            {/* Ambient Background Gradient Glow */}
            <div className="absolute top-0 right-0 w-24 h-24 rounded-full bg-primary/10 blur-2xl pointer-events-none" />

            <div className="flex gap-4 items-start relative z-10">
              {/* Animated Glowing Icon */}
              <div className="rounded-xl p-3 bg-primary/10 border border-primary/20 text-primary flex items-center justify-center shrink-0">
                <Cookie size={22} className="animate-spin-slow" />
              </div>

              <div className="space-y-3 min-w-0">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-sm text-foreground flex items-center gap-1.5">
                    Cookie & Storage Notice
                  </h3>
                  <button
                    onClick={handleDecline}
                    className="text-muted-foreground hover:text-foreground transition-colors p-1 hover:bg-muted/40 rounded-lg"
                    aria-label="Close Notice"
                  >
                    <X size={16} />
                  </button>
                </div>
                
                <p className="text-xs text-muted-foreground leading-relaxed">
                  We use cookies and browser local storage to maintain your authenticated cafe session, save local configurations, and deliver a secure, multi-tenant administrative experience. No tracking or advertising cookies are utilized.
                </p>

                <div className="text-[11px] text-muted-foreground/80 flex flex-wrap gap-x-2 gap-y-1">
                  <span>By accepting, you consent to our</span>
                  <button
                    onClick={onShowPrivacy}
                    className="text-primary hover:underline font-medium focus:outline-none"
                  >
                    Privacy Policy
                  </button>
                  <span>and</span>
                  <button
                    onClick={onShowTerms}
                    className="text-primary hover:underline font-medium focus:outline-none"
                  >
                    Terms of Service
                  </button>
                  <span>.</span>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-3 pt-1">
                  <button
                    onClick={handleAccept}
                    className="h-9 px-4 text-xs font-bold rounded-xl bg-primary hover:bg-primary/95 text-primary-foreground shadow-md shadow-primary/10 transition-all flex items-center justify-center gap-1.5 hover:scale-[1.02]"
                  >
                    <ShieldCheck size={14} /> Accept & Acknowledge
                  </button>
                  <button
                    onClick={handleDecline}
                    className="h-9 px-4 text-xs font-semibold rounded-xl bg-muted/40 hover:bg-muted/60 text-muted-foreground hover:text-foreground border border-border/40 transition-colors"
                  >
                    Decline
                  </button>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
