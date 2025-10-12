import React, { useEffect, useRef } from "react";
import { RotateCcw, X } from "lucide-react";

const RefundModal = ({ open, onClose }) => {
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
      aria-labelledby="refund-title"
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
            <RotateCcw className="h-6 w-6 text-primary" />
            <h2 id="refund-title" className="text-lg font-bold text-primary-text">
              Refund & Cancellation Policy
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
              Thank you for choosing <strong>theppl.in</strong>. This Refund and
              Cancellation Policy outlines the terms under which users can request
              refunds or cancel their registrations, payments, or services through
              our platform.
            </p>

            <section>
              <h3 className="text-primary-text font-semibold mb-2">
                1. Event Registrations and Services
              </h3>
              <p>
                All registrations or services booked through theppl.in are
                considered confirmed once payment is successfully processed. Users
                are advised to review all details carefully before completing a
                transaction.
              </p>
            </section>

            <section>
              <h3 className="text-primary-text font-semibold mb-2">
                2. Cancellation Policy
              </h3>
              <p>
                Cancellations can be made within the stipulated time frame
                announced for each event or service. Requests for cancellation
                beyond the specified deadline may not be accepted. To initiate a
                cancellation, please contact us at{" "}
                <a
                  href="mailto:support@theppl.in"
                  className="text-primary hover:underline"
                >
                  support@theppl.in
                </a>{" "}
                with your registration details.
              </p>
            </section>

            <section>
              <h3 className="text-primary-text font-semibold mb-2">
                3. Refund Policy
              </h3>
              <p>
                Refunds, if applicable, will be processed in accordance with the
                terms specified for each event or service. Approved refunds will be
                credited to the original payment method within 7–14 working days
                after approval.
              </p>
            </section>

            <section>
              <h3 className="text-primary-text font-semibold mb-2">
                4. Non-Refundable Transactions
              </h3>
              <p>
                Certain services, donations, or registration fees may be marked as
                non-refundable. In such cases, no refund shall be provided once the
                payment is completed.
              </p>
            </section>

            <section>
              <h3 className="text-primary-text font-semibold mb-2">
                5. Event Cancellations by Organizers
              </h3>
              <p>
                In the event of a cancellation or postponement by the organizers,
                registered participants will be notified via email or SMS. Full or
                partial refunds may be provided depending on the circumstances.
              </p>
            </section>

            <section>
              <h3 className="text-primary-text font-semibold mb-2">
                6. Processing Timeline
              </h3>
              <p>
                Refund processing time may vary depending on the payment gateway,
                bank, or card issuer. Users will be notified once the refund has
                been initiated.
              </p>
            </section>

            <section>
              <h3 className="text-primary-text font-semibold mb-2">
                7. Dispute Resolution
              </h3>
              <p>
                Any disputes related to refunds or cancellations shall be governed
                by the laws of India and subject to the exclusive jurisdiction of
                the courts in Andhra Pradesh, India.
              </p>
            </section>

            <section>
              <h3 className="text-primary-text font-semibold mb-2">8. Contact Us</h3>
              <p>
                For any questions or requests related to refunds and cancellations,
                please contact us at:{" "}
                <a
                  href="mailto:support@theppl.in"
                  className="text-primary hover:underline"
                >
                  support@theppl.in
                </a>
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
            © {new Date().getFullYear()} Premier Project League — Refund & Cancellation Policy
          </span>
        </div>
      </div>
    </div>
  );
};

export default RefundModal;