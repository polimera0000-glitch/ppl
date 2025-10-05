// src/pages/ContactPage.jsx
import React, { useRef, useState } from "react";
import emailjs from "@emailjs/browser";

export default function ContactPage() {
  const formRef = useRef(null);
  const [sending, setSending] = useState(false);
  const [ok, setOk] = useState(null); // null | true | false

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!formRef.current) return;
    setSending(true);
    setOk(null);
    try {
      // Replace with your own IDs/keys (publicKey is safe to expose)
      await emailjs.sendForm(
        "service_ms9xa0j",        // ✅ your service ID
        "template_3tqe0bu",       // ✅ your template ID
        formRef.current,
        { publicKey: "1y4I4OqOUdzBkQ2jA" } // ✅ your public key
      );
      setOk(true);
      formRef.current.reset();
    } catch (err) {
      console.error(err);
      setOk(false);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-primary-text px-4 py-10 flex items-center justify-center">
      <div className="w-full max-w-xl bg-surface border border-border rounded-2xl shadow-card p-6 sm:p-8">
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold">Get In Touch</h1>
          <p className="text-secondary-text mt-1">We’d love to hear from you</p>
        </div>

        <div className="bg-background border border-border rounded-xl p-4 mb-6">
          <h3 className="font-semibold mb-3">Contact Information</h3>
          <ul className="space-y-2 text-secondary-text">
            <li>📧 abc@gmail.com</li>
            <li>📞 +91 9876543210</li>
            <li>📍 Duvvada, Visakhapatnam, India</li>
          </ul>
        </div>

        <form ref={formRef} onSubmit={onSubmit} className="space-y-4" id="contactForm">
          <div>
            <label className="block text-sm font-semibold mb-1">Full Name</label>
            <input
              name="name"
              required
              placeholder="Enter your name"
              className="w-full rounded-lg px-4 py-2 bg-background border border-border focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold mb-1">Email Address</label>
            <input
              type="email"
              name="email"
              required
              placeholder="your.email@example.com"
              className="w-full rounded-lg px-4 py-2 bg-background border border-border focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold mb-1">Subject</label>
            <input
              name="subject"
              required
              placeholder="What is this about?"
              className="w-full rounded-lg px-4 py-2 bg-background border border-border focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold mb-1">Message</label>
            <textarea
              name="message"
              required
              placeholder="Write your message here..."
              className="w-full min-h-32 rounded-lg px-4 py-2 bg-background border border-border focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
          </div>

          <button
            type="submit"
            disabled={sending}
            className="w-full py-3 rounded-lg font-semibold bg-primary text-white hover:bg-primary-hover transition disabled:opacity-60"
          >
            {sending ? "Sending..." : "Send Message"}
          </button>

          {ok === true && (
            <div className="mt-3 rounded-lg border border-green-300 bg-green-50 px-3 py-2 text-green-800">
              ✓ Thank you! Your message has been sent successfully.
            </div>
          )}
          {ok === false && (
            <div className="mt-3 rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-red-800">
              Failed to send email. Please try again.
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
