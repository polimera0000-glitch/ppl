// src/components/ContactModal.jsx
import React, { useEffect, useRef, useState } from "react";
import emailjs from "@emailjs/browser";
import { X, CheckCircle2, AlertTriangle } from "lucide-react";

export default function ContactModal({ open, onClose }) {
  const dialogRef = useRef(null);
  const formRef = useRef(null);

  const [sending, setSending] = useState(false);
  const [ok, setOk] = useState(null);
  const [touched, setTouched] = useState({});

  // ❌ REMOVE body scroll lock so the page behind can scroll
  // useEffect(() => {
  //   if (!open) return;
  //   const prev = document.body.style.overflow;
  //   document.body.style.overflow = "hidden";
  //   return () => (document.body.style.overflow = prev);
  // }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === "Escape" && onClose?.();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  useEffect(() => {
    if (open && dialogRef.current) dialogRef.current.focus();
  }, [open]);

  const setFieldTouched = (name) => setTouched((t) => ({ ...t, [name]: true }));
  const getValue = (name) => formRef.current?.[name]?.value?.trim() ?? "";
  const errors = (() => {
    const e = {};
    const email = getValue("email");
    if (!getValue("name")) e.name = "Your name is required.";
    if (!email) e.email = "Email is required.";
    else if (!/^\S+@\S+\.\S+$/.test(email)) e.email = "Enter a valid email.";
    if (!getValue("subject")) e.subject = "Please add a subject.";
    if (!getValue("message")) e.message = "Please enter a message.";
    return e;
  })();

  const onSubmit = async (e) => {
    e.preventDefault();
    setTouched({ name: true, email: true, subject: true, message: true });
    if (Object.keys(errors).length) return;
    setSending(true);
    setOk(null);
    try {
      await emailjs.sendForm("service_ms9xa0j", "template_3tqe0bu", formRef.current, {
        publicKey: "1y4I4OqOUdzBkQ2jA",
      });
      setOk(true);
      formRef.current?.reset();
      setTouched({});
    } catch (err) {
      console.error(err);
      setOk(false);
    } finally {
      setSending(false);
    }
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="contact-title"
    >
      {/* Backdrop (keeps clicks to close; background can still scroll) */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      {/* Dialog */}
      <div
        ref={dialogRef}
        tabIndex={-1}
        className={[
          "relative w-full max-w-xl md:max-w-xl",
          "bg-surface border border-border rounded-2xl shadow-2xl",
          "outline-none max-h-[94vh] flex flex-col",
        ].join(" ")}
      >
        {/* Header */}
        <div className="px-6 md:px-8 pt-6 md:pt-8 pb-4 flex items-start justify-between">
          <div>
            <h2 id="contact-title" className="text-2xl md:text-3xl font-bold text-primary-text">
              Get In Touch
            </h2>
            <p className="text-secondary-text mt-1">We’d love to hear from you</p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="p-2 rounded-lg border border-border hover:bg-border transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ⭐ Scrollable content area (make scrollbar visible via CSS) */}
        <div className="px-6 md:px-8 pb-4 overflow-y-auto flex-1 contact-scroll">
          {/* Info */}
          <div className="bg-background border border-border rounded-xl p-4 mb-6">
            <h3 className="font-semibold mb-3 text-primary-text">Contact Information</h3>
            <ul className="space-y-1.5 text-secondary-text text-sm">
              <li>📧 abc@gmail.com</li>
              <li>📞 +91 9876543210</li>
              <li>📍 Duvvada, Visakhapatnam, India</li>
            </ul>
          </div>

          {/* Alerts */}
          {ok === true && (
            <div className="mb-4 flex items-start gap-3 rounded-lg border border-green-300 bg-green-50 px-3 py-2 text-green-800">
              <CheckCircle2 className="w-5 h-5 mt-0.5" />
              <p>Thank you! Your message has been sent successfully.</p>
            </div>
          )}
          {ok === false && (
            <div className="mb-4 flex items-start gap-3 rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-red-800">
              <AlertTriangle className="w-5 h-5 mt-0.5" />
              <p>Failed to send email. Please try again.</p>
            </div>
          )}

          {/* Form */}
          <form ref={formRef} onSubmit={onSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold mb-1">Full Name</label>
                <input
                  name="name"
                  required
                  autoComplete="name"
                  onBlur={() => setFieldTouched("name")}
                  placeholder="Enter your name"
                  className={[
                    "w-full rounded-lg px-4 py-3",
                    "bg-background border",
                    errors.name && touched.name ? "border-red-400" : "border-border",
                    "text-primary-text placeholder:text-secondary-text",
                    "focus:outline-none focus:ring-2 focus:ring-primary/40",
                  ].join(" ")}
                />
                {errors.name && touched.name && (
                  <p className="mt-1 text-xs text-red-500">{errors.name}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold mb-1">Email Address</label>
                <input
                  type="email"
                  name="email"
                  required
                  autoComplete="email"
                  onBlur={() => setFieldTouched("email")}
                  placeholder="your.email@example.com"
                  className={[
                    "w-full rounded-lg px-4 py-3",
                    "bg-background border",
                    errors.email && touched.email ? "border-red-400" : "border-border",
                    "text-primary-text placeholder:text-secondary-text",
                    "focus:outline-none focus:ring-2 focus:ring-primary/40",
                  ].join(" ")}
                />
                {errors.email && touched.email && (
                  <p className="mt-1 text-xs text-red-500">{errors.email}</p>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold mb-1">Subject</label>
              <input
                name="subject"
                required
                onBlur={() => setFieldTouched("subject")}
                placeholder="What is this about?"
                className={[
                  "w-full rounded-lg px-4 py-3",
                  "bg-background border",
                  errors.subject && touched.subject ? "border-red-400" : "border-border",
                  "text-primary-text placeholder:text-secondary-text",
                  "focus:outline-none focus:ring-2 focus:ring-primary/40",
                ].join(" ")}
              />
              {errors.subject && touched.subject && (
                <p className="mt-1 text-xs text-red-500">{errors.subject}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-semibold mb-1">Message</label>
              <textarea
                name="message"
                required
                onBlur={() => setFieldTouched("message")}
                placeholder="Write your message here..."
                className={[
                  "w-full min-h-40 rounded-lg px-4 py-3",
                  "bg-background border",
                  errors.message && touched.message ? "border-red-400" : "border-border",
                  "text-primary-text placeholder:text-secondary-text",
                  "focus:outline-none focus:ring-2 focus:ring-primary/40",
                ].join(" ")}
              />
              {errors.message && touched.message && (
                <p className="mt-1 text-xs text-red-500">{errors.message}</p>
              )}
            </div>
          </form>
        </div>

        {/* Actions */}
        <div className="px-6 md:px-8 py-4 border-t border-border flex items-center gap-3">
          <button
            onClick={onSubmit}
            disabled={sending}
            className="flex-1 py-3 rounded-lg font-semibold bg-primary text-white hover:bg-primary-hover transition disabled:opacity-60"
          >
            {sending ? "Sending..." : "Send Message"}
          </button>
        </div>
      </div>
    </div>
  );
}
