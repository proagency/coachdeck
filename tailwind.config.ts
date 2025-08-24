import type { Config } from "tailwindcss";

export default {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: { DEFAULT: "#155EEF", hover: "#0B4BDD" }
      },
      container: { center: true, padding: "1rem" },
      borderRadius: { DEFAULT: "3px" }
    }
  },
  plugins: [],
} satisfies Config;
