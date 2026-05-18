import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#337AB7",
          muted: "#4C83B2",
          dark: "#1B263B",
          darker: "#12263A",
        },
        accent: { DEFAULT: "#FF6A14", hover: "#E55D0B" },
        brand: { blue: "#007CF1", border: "#0069CD", nav: "#527DA4" },
        surface: { card: "#FFFFFF", tint: "#D9E5EF", cyan: "#D5E8F7" },
        ink: {
          900: "#1B263B",
          800: "#333333",
          700: "#4E575B",
          500: "#5E6B78",
          400: "#979DA3",
          300: "#777777",
        },
        line: { soft: "#D7DADD", card: "#D9E5EF", input: "#BDBDBD" },
      },
      borderRadius: {
        sm: "4px",
        md: "6px",
        lg: "16px",
        xl: "22px",
        pill: "40px",
      },
      boxShadow: {
        card: "rgba(13,39,62,0.08) 0 12px 36px 0",
        cardHover: "rgba(13,39,62,0.12) 0 16px 48px 0",
        btn: "rgba(0,0,0,0.2) 0 3px 1px -2px, rgba(0,0,0,0.14) 0 2px 2px 0, rgba(0,0,0,0.12) 0 1px 5px 0",
        inset: "rgba(0,0,0,0.075) 0 1px 1px 0 inset",
      },
      fontFamily: {
        sans: [
          "Rubik",
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "Helvetica Neue",
          "sans-serif",
        ],
      },
    },
  },
  plugins: [],
};
export default config;
