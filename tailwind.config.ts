import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: {
          950: "#08090a",
          900: "#0d0f10",
          850: "#121416",
          800: "#17191c",
          700: "#222529",
          600: "#2e3237",
          500: "#4a4f56",
        },
        accent: {
          DEFAULT: "#c8ff4d",
          soft: "#dcff8a",
          dim: "#97c92f",
        },
      },
      fontFamily: {
        sans: [
          "ui-sans-serif",
          "system-ui",
          "-apple-system",
          "Segoe UI",
          "Roboto",
          "Helvetica Neue",
          "Arial",
          "sans-serif",
        ],
      },
      boxShadow: {
        soft: "0 10px 40px -12px rgba(0,0,0,0.65)",
        glow: "0 0 0 1px rgba(200,255,77,0.25), 0 12px 40px -14px rgba(200,255,77,0.35)",
      },
      keyframes: {
        "fade-in": {
          from: { opacity: "0", transform: "translateY(6px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "slide-up": {
          from: { transform: "translateY(100%)" },
          to: { transform: "translateY(0)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-500px 0" },
          "100%": { backgroundPosition: "500px 0" },
        },
      },
      animation: {
        "fade-in": "fade-in 240ms ease-out both",
        "slide-up": "slide-up 260ms cubic-bezier(0.22,1,0.36,1) both",
        shimmer: "shimmer 1.6s linear infinite",
      },
    },
  },
  plugins: [],
};

export default config;
