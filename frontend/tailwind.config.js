/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#0d0e12",
        panel: "#161822",
        border: "#26293b",
        primary: "#6366f1",
        primaryHover: "#4f46e5",
      }
    },
  },
  plugins: [],
}
