import type { Config } from "tailwindcss";

export default {
  darkMode: "class",
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        primary: {
          DEFAULT: "var(--primary)",
          hover: "var(--primary-hover)",
        },
        card: "var(--card)",
        "card-hover": "var(--card-hover)",
        border: "var(--border)",
        sidebar: "var(--sidebar-bg)",
        "sidebar-border": "var(--sidebar-border)",
        "sidebar-fg": "var(--sidebar-fg)",
        "sidebar-muted": "var(--sidebar-muted)",
        header: "var(--header-bg)",
        "header-border": "var(--header-border)",
        "header-fg": "var(--header-fg)",
        "header-muted": "var(--header-muted)",
        input: "var(--input-bg)",
        "input-border": "var(--input-border)",
        muted: "var(--muted)",
      },
    },
  },
  plugins: [],
} satisfies Config;
