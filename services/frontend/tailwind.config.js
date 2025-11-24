/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: "#6A4DFF",
        success: "#4CC9A6",
        danger: "#FF6B6B",
        warning: "#F4C84C",
        "card-bg": "#FFFFFF",
      },
      boxShadow: {
        soft: "0 8px 32px rgba(31, 38, 135, 0.1)",
      },
      borderRadius: {
        xl2: "1rem",
      }
    },
  },
  plugins: [],
}
