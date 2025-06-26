/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        /* FIS Brand Colors */
        fis: {
          green: '#00a651',
          'green-light': '#4ade80',
          'green-dark': '#16a34a',
          'green-50': '#f0fdf4',
          'green-100': '#dcfce7',
          'green-600': '#00a651',
          'green-700': '#059669',
        },
        success: {
          DEFAULT: "hsl(var(--success))",
          foreground: "hsl(var(--success-foreground))",
          muted: "hsl(var(--success-muted))",
        },
        warning: {
          DEFAULT: "hsl(var(--warning))",
          foreground: "hsl(var(--warning-foreground))",
          muted: "hsl(var(--warning-muted))",
        },
        info: {
          DEFAULT: "hsl(var(--info))",
          foreground: "hsl(var(--info-foreground))",
          muted: "hsl(var(--info-muted))",
        },
        critical: {
          DEFAULT: "hsl(var(--critical))",
          foreground: "hsl(var(--critical-foreground))",
          muted: "hsl(var(--critical-muted))",
          '204': '#dc2626',
          'red-bg': '#fef2f2',
          'orange-bg': '#fff7ed',
        },
        status: {
          high: {
            DEFAULT: "hsl(var(--status-high))",
            foreground: "hsl(var(--status-high-foreground))",
            muted: "hsl(var(--status-high-muted))",
          },
          medium: {
            DEFAULT: "hsl(var(--status-medium))",
            foreground: "hsl(var(--status-medium-foreground))",
            muted: "hsl(var(--status-medium-muted))",
          },
          low: {
            DEFAULT: "hsl(var(--status-low))",
            foreground: "hsl(var(--status-low-foreground))",
            muted: "hsl(var(--status-low-muted))",
          },
        },
        progress: {
          complete: "hsl(var(--progress-complete))",
          partial: "hsl(var(--progress-partial))",
          none: "hsl(var(--progress-none))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      animation: {
        'pulse-critical': 'pulse 1s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'bounce-alert': 'bounce 1s infinite',
      }
    },
  },
  plugins: [],
  safelist: [
    'data-[state=checked]:bg-blue-600',
    'data-[state=checked]:text-white', 
    'data-[state=checked]:border-blue-600',
    'data-[state=unchecked]:bg-white',
    'data-[state=unchecked]:border-gray-300'
  ],
} 