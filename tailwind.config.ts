import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        paper: {
          DEFAULT: "#FAF8F5", // Warm archival ivory
          light: "#FFFFFF",
          warm: "#F4F0E8",   // Warm newsprint / parchment
          dark: "#EFECE4",
        },
        ink: {
          DEFAULT: "#1A1816", // Printer's carbon ink
          dark: "#12100E",
          muted: "#6B655F",  // Muted editorial caption
          faint: "#9C948B",  // Monospace meta
        },
        editorial: {
          border: "#E8E2D8",
          "border-dark": "#D6CEC2",
          rule: "#DFD7CC",
        },
        terracotta: {
          DEFAULT: "#9E472A",
          hover: "#873A20",
          light: "#FDF5F2",
        },
        ochre: {
          DEFAULT: "#B38636",
          light: "#FBF7EE",
        },
        forest: {
          DEFAULT: "#2E3D2E",
          light: "#F3F7F3",
        },
      },
      fontFamily: {
        serif: [
          "var(--font-serif)",
          "Newsreader",
          "Playfair Display",
          "Georgia",
          "Cambria",
          "Times New Roman",
          "serif",
        ],
        sans: [
          "var(--font-sans)",
          "Inter",
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "sans-serif",
        ],
        mono: [
          "var(--font-mono)",
          "JetBrains Mono",
          "ui-monospace",
          "SFMono-Regular",
          "Menlo",
          "monospace",
        ],
      },
      letterSpacing: {
        widest: "0.15em",
        ultra: "0.25em",
      },
      boxShadow: {
        plate: "0 4px 20px -2px rgba(26, 24, 22, 0.06)",
        dropdown: "0 10px 25px -5px rgba(26, 24, 22, 0.08), 0 8px 10px -6px rgba(26, 24, 22, 0.04)",
      },
    },
  },
  plugins: [],
};

export default config;
