import React from "react";
import { Clock } from "lucide-react";

const Courses = () => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-surface text-center p-6">
      {/* Icon */}
      <div className="mb-6 p-4 rounded-full bg-primary/10">
        <Clock className="h-16 w-16 text-primary" />
      </div>

      {/* Title */}
      <h2 className="text-3xl font-bold text-primary-text mb-3">
        Courses Coming Soon
      </h2>

      {/* Description */}
      <p className="text-secondary-text text-base leading-relaxed mb-8 max-w-md">
        We're working hard to bring you exciting new learning modules. Stay tuned for updates!
      </p>

      {/* Action button */}
      <a
        href="/"
        className="px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors font-medium"
      >
        Back to Home
      </a>

      <footer className="mt-10 text-xs text-secondary-text">
        © {new Date().getFullYear()} Premier Project League
      </footer>
    </div>
  );
};

export default Courses;
