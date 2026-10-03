/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: "#0a5f3c",  // deep school green
          dark: "#06452b",
          light: "#1c8a5a",
          accent: "#c9a227"   // warm gold (from logo)
        }
      },
      fontFamily: {
        display: ['"Poppins"', "system-ui", "sans-serif"],
        body: ['"Inter"', "system-ui", "sans-serif"]
      }
    }
  },
  plugins: []
}
