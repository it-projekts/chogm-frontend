/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          400: '#6185f0',
          500: '#3B5BDB',
          600: '#3451C7',
          700: '#2C44B0',
        }
      },
    },
  },
  plugins: [],
}
