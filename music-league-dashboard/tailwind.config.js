/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Design system colors from design.json
        lavender: {
          DEFAULT: '#A178F1',
        },
        mint: {
          DEFAULT: '#4EE2B5',
        },
        cyan: {
          flash: '#2EC9FF',
        },
        sun: {
          DEFAULT: '#FFE200',
        },
        magenta: {
          DEFAULT: '#E044A7',
        },
        charcoal: {
          DEFAULT: '#18171F',
        },
        graphite: {
          DEFAULT: '#1F1E26',
        },
        ink: {
          DEFAULT: '#0D0C13',
        },
        mist: {
          DEFAULT: '#D3CFDA',
        },
        smoke: {
          DEFAULT: '#8D889B',
        },
      },
      spacing: {
        '4.5': '18px',
        '5.5': '22px',
      },
      borderRadius: {
        'card': '20px',
        'shell': '24px',
      },
      fontFamily: {
        'poppins': ['Poppins', 'sans-serif'],
        'inter': ['Inter', 'sans-serif'],
      },
      boxShadow: {
        'card': '0 20px 35px rgba(0,0,0,0.35)',
        'chip': 'inset 0 0 0 1px rgba(255,255,255,0.05), 0 10px 20px rgba(0,0,0,0.45)',
      },
    },
  },
  plugins: [],
}

