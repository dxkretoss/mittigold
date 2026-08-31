/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          DEFAULT: '#122036',
          2: '#1c3050',
          3: '#0d1826',
        },
        wheat: {
          DEFAULT: '#C89B3C',
          light: '#E7C878',
        },
        sitebg: '#F7F5F0',
        panel: '#FFFFFF',
        ink: {
          DEFAULT: '#1D2430',
          soft: '#5B6472',
          faint: '#94A0AC',
        },
        line: '#E7E3D8',
        brandGreen: {
          DEFAULT: '#3D7A5C',
          bg: '#EAF3EE',
        },
        brandAmber: {
          DEFAULT: '#B9832E',
          bg: '#FBF1E1',
        },
        brandRed: {
          DEFAULT: '#B2483A',
          bg: '#FBEAE7',
        },
        brandBlue: {
          DEFAULT: '#2F5D8A',
          bg: '#EAF1F8',
        },
        slateBg: '#EEF1F5',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        sora: ['Sora', 'sans-serif'],
        mono: ['IBM Plex Mono', 'monospace'],
      },
      borderRadius: {
        portal: '12px',
      }
    },
  },
  plugins: [],
}
