/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        brand: {
          black: "#0e0f0c",
          green: "#9fe870",
          greenDark: "#163300",
          mint: "#e2f6d5",
          pastel: "#cdffad",
        },
        semantic: {
          positive: "#054d28",
          danger: "#d03238",
          warning: "#ffd11a",
          orange: "#ffc091",
          infoBg: "rgba(56,200,255,0.10)",
        },
        neutral: {
          warmDark: "#454745",
          gray: "#868685",
          lightSurface: "#e8ebe6",
          darkSurface: "#171a18",
        },
      },
      borderRadius: {
        "token-sm": "2px",
        "token-md": "10px",
        "token-lg": "16px",
        "token-xl": "20px",
        "token-2xl": "30px",
        "token-3xl": "40px",
        mega: "1000px",
        pill: "9999px",
      },
      fontFamily: {
        display: ["Inter_900Black", "Inter", "sans-serif"],
        sans: ["Inter_400Regular", "Inter", "sans-serif"],
        semibold: ["Inter_600SemiBold", "Inter", "sans-serif"],
      },
    },
  },
  plugins: [],
};
