import React, { useEffect, useRef } from "react";
import { Shield, X } from "lucide-react";

const PrivacyModal = ({ open, onClose }) => {
  const dialogRef = useRef(null);
  const firstFocusableRef = useRef(null);

  // Lock background scroll + close on Esc + focus trap
  useEffect(() => {
    if (!open) return;

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKey = (e) => {
      if (e.key === "Escape") onClose?.();
      if (e.key === "Tab") {
        // simple focus trap
        const focusable = dialogRef.current?.querySelectorAll(
          'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])'
        );
        if (!focusable || focusable.length === 0) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];

        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    document.addEventListener("keydown", handleKey);

    // Move focus into dialog
    const toFocus = firstFocusableRef.current || dialogRef.current;
    toFocus?.focus?.();

    return () => {
      document.body.style.overflow = prevOverflow;
      document.removeEventListener("keydown", handleKey);
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6"
      aria-modal="true"
      role="dialog"
      aria-labelledby="privacy-title"
    >
      {/* Backdrop */}
      <button
        aria-label="Close"
        onClick={onClose}
        className="absolute inset-0 bg-black/50 focus:outline-none"
      />

      {/* Dialog */}
      <div
        ref={dialogRef}
        className="
          relative w-full max-w-3xl
          max-h-[90vh] md:max-h-[85vh]
          overflow-hidden rounded-2xl border border-border bg-surface shadow-xl
          outline-none
          flex flex-col
        "
        tabIndex={-1}
      >
        {/* Sticky header */}
        <div className="sticky top-0 z-10 flex items-center justify-between px-5 py-4 border-b border-border bg-surface/80 backdrop-blur supports-[backdrop-filter]:bg-surface/60">
          <div className="flex items-center gap-3">
            <Shield className="h-6 w-6 text-primary" />
            <h2 id="privacy-title" className="text-lg font-bold text-primary-text">
              Privacy Policy
            </h2>
          </div>
          <button
            ref={firstFocusableRef}
            onClick={onClose}
            className="p-2 rounded-lg bg-surface hover:bg-border border border-border focus:outline-none focus:ring-2 focus:ring-primary/40"
          >
            <X className="w-5 h-5 text-secondary-text" />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="px-5 py-4 overflow-y-auto overflow-x-hidden">
          <div className="space-y-6 text-sm leading-6 text-secondary-text">
            <p className="text-primary-text">
              At <strong>theppl.in</strong>, we value your privacy. This policy
              explains how we collect, use, and safeguard your information.
            </p>

            <section>
              <h3 className="text-primary-text font-semibold mb-2">Information We Collect</h3>
              <p>
                We may collect personal information (name, email) and non-personal
                data (browser type, IP, usage statistics via cookies).
              </p>
            </section>

            <section>
              <h3 className="text-primary-text font-semibold mb-2">How We Use Information</h3>
              <p>
                To provide and improve services, communicate updates, process
                registrations, and respond to inquiries.
              </p>
            </section>

            <section>
              <h3 className="text-primary-text font-semibold mb-2">Cookies</h3>
              <p>
                We use cookies to enhance experience and for analytics. You can
                disable cookies in your browser; some features may not work
                properly.
              </p>
            </section>

            <section>
              <h3 className="text-primary-text font-semibold mb-2">Sharing & Disclosure</h3>
              <p>
                We don’t sell personal data. We may share limited information with
                trusted providers (hosting, payments) only as necessary to operate
                the site.
              </p>
            </section>

            <section>
              <h3 className="text-primary-text font-semibold mb-2">Data Security</h3>
              <p>
                We apply reasonable safeguards but cannot guarantee absolute
                security of electronic transmissions.
              </p>
            </section>

            <section>
              <h3 className="text-primary-text font-semibold mb-2">Your Rights</h3>
              <p>
                You may request access, correction, or deletion of your data by
                contacting us.
              </p>
            </section>

            <section>
              <h3 className="text-primary-text font-semibold mb-2">Children’s Privacy</h3>
              <p>Our services are not directed to children under 13.</p>
            </section>

            <section>
              <h3 className="text-primary-text font-semibold mb-2">Changes to This Policy</h3>
              <p>
                We may update this policy. Continued use means you accept the
                changes — please check this page regularly.
              </p>
            </section>

            <section>
              <h3 className="text-primary-text font-semibold mb-2">Contact Us</h3>
              <p>
                Email{" "}
                <a href="mailto:privacy@theppl.in" className="text-primary hover:underline">
                  privacy@theppl.in
                </a>{" "}
                for any privacy questions.
              </p>
            </section>

            <p className="text-xs opacity-70">
              Last updated:{" "}
              {new Date().toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </p>
          </div>
        </div>

        {/* Footer note (centered, subtle like a caption) */}
        <div className="px-6 md:px-8 py-4 border-t border-border flex justify-center items-center">
          <span className="text-xs text-secondary-text text-center">
            © {new Date().getFullYear()} Premier Project League — Privacy Policy
          </span>
        </div>
      </div>
    </div>
  );
};

export default PrivacyModal;
