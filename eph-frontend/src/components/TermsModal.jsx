import React, { useEffect, useRef } from "react";
import { Scale, X } from "lucide-react";

export default function TermsModal({ open, onClose }) {
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
        // Simple focus trap (loops focus inside modal)
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
      role="dialog"
      aria-modal="true"
      aria-labelledby="terms-title"
    >
      {/* Backdrop (click to close) */}
      <button
        aria-label="Close"
        onClick={onClose}
        className="absolute inset-0 bg-black/50 focus:outline-none"
      />

      {/* Dialog */}
      <div
        ref={dialogRef}
        tabIndex={-1}
        className="
          relative w-full max-w-3xl
          max-h-[90vh] md:max-h-[85vh]
          overflow-hidden rounded-2xl border border-border bg-surface shadow-xl
          outline-none flex flex-col
        "
      >
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between px-5 py-4 border-b border-border bg-surface/80 backdrop-blur supports-[backdrop-filter]:bg-surface/60">
          <div className="flex items-center gap-3">
            <Scale className="h-6 w-6 text-primary" />
            <h2 id="terms-title" className="text-lg font-bold text-primary-text">
              Terms & Conditions
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
              Welcome to <strong>theppl.in</strong>. By accessing or using our website,
              you agree to be bound by these Terms and Conditions.
            </p>

            <section>
              <h3 className="text-primary-text font-semibold mb-2">Definitions</h3>
              <p>
                “Website” refers to theppl.in. “We”, “Us”, and “Our” refer to the owners
                and administrators of the website. “User” refers to any person accessing
                or using our website.
              </p>
            </section>

            <section>
              <h3 className="text-primary-text font-semibold mb-2">Use of the Website</h3>
              <p>
                Users agree to use the website only for lawful purposes and in a manner
                that does not infringe the rights of, restrict, or inhibit anyone else’s
                use of the site. Unauthorized access, data extraction, or misuse of site
                content is strictly prohibited.
              </p>
            </section>

            <section>
              <h3 className="text-primary-text font-semibold mb-2">Account & Registration</h3>
              <p>
                Users are responsible for maintaining confidentiality of login information
                and for all activities under their account. Users must be at least 13 years
                old to register or use this website.
              </p>
            </section>

            <section>
              <h3 className="text-primary-text font-semibold mb-2">Intellectual Property</h3>
              <p>
                All content, graphics, logos, and materials on this site are owned by
                theppl.in unless otherwise stated. You may not reproduce, distribute, or
                exploit any material without written consent.
              </p>
            </section>

            <section>
              <h3 className="text-primary-text font-semibold mb-2">Payments & Refunds</h3>
              <p>
                Payments made through the site (if applicable) are subject to the stated
                pricing and refund policies. Refunds, if applicable, will follow our Refund
                Policy guidelines.
              </p>
            </section>

            <section>
              <h3 className="text-primary-text font-semibold mb-2">Limitation of Liability</h3>
              <p>
                We do not guarantee that the website will be error-free or available at all
                times. To the maximum extent permitted by law, we are not liable for any
                damages resulting from the use of our site.
              </p>
            </section>

            <section>
              <h3 className="text-primary-text font-semibold mb-2">Indemnification</h3>
              <p>
                Users agree to indemnify and hold harmless theppl.in and its team from any
                claims, damages, or expenses arising from misuse of the website.
              </p>
            </section>

            <section>
              <h3 className="text-primary-text font-semibold mb-2">Termination</h3>
              <p>
                We reserve the right to suspend or terminate user access at any time
                without notice if we believe the terms have been violated.
              </p>
            </section>

            <section>
              <h3 className="text-primary-text font-semibold mb-2">Governing Law</h3>
              <p>These terms are governed by the laws of India.</p>
            </section>

            <section>
              <h3 className="text-primary-text font-semibold mb-2">Changes to the Terms</h3>
              <p>
                We may revise these Terms from time to time. Your continued use of the
                Website means you accept the changes. Please check this page frequently
                for updates.
              </p>
            </section>

            <section>
              <h3 className="text-primary-text font-semibold mb-2">Contact Us</h3>
              <p>
                Questions? Email{" "}
                <a href="mailto:support@theppl.in" className="text-primary hover:underline">
                  support@theppl.in
                </a>
                .
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

        {/* Footer note (centered, subtle) */}
        <div className="px-6 md:px-8 py-4 border-t border-border flex justify-center items-center">
          <span className="text-xs text-secondary-text text-center">
            © {new Date().getFullYear()} Premier Project League — Terms and Conditions
          </span>
        </div>
      </div>
    </div>
  );
}
