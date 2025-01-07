/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      lineHeight: {
        tight: "1.25", // Adiciona um estilo para espaçamento menor
      },
      colors: {
        secundaria: {
          DEFAULT: '#C1AAA8',
          50: '#f3eeee',
          100: '#f3eeee',
          200: '#e6dddc',
          300: '#dacccb',
          400: '#cebbba',
          500: '#c1aaa8',
          600: '#a4817e',
          700: '#7f5d5a',
          800: '#553e3c',
          900: '#2a1f1e'
        },
        
        primaria: "#ffffff",
        terceira: {
          DEFAULT: '#E798A7',
          100: '#faeaed',
          200: '#f5d6db',
          300: '#f0c1ca',
          400: '#ecacb8',
          500: '#e798a7',
          550: '#e07c8f',
          600: '#d85a71', 
          700: '#ba2c46', 
          800: '#7c1d2e', 
          900: '#3e0f17'
        },
        quarta: "#2B2B2B",
        quinta: "#6d6d6d",
        sexta: "#ff6f61",
        black: {
          DEFAULT: "#000",
          100: "#1E1E2D",
          200: "#232533",
        },
        gray: {
          100: "#CDCDE0",
        },
      },
      fontFamily: {
        pthin: ["Poppins-Thin", "sans-serif"],
        pextralight: ["Poppins-ExtraLight", "sans-serif"],
        plight: ["Poppins-Light", "sans-serif"],
        pregular: ["Poppins-Regular", "sans-serif"],
        pmedium: ["Poppins-Medium", "sans-serif"],
        psemibold: ["Poppins-SemiBold", "sans-serif"],
        pbold: ["Poppins-Bold", "sans-serif"],
        pextrabold: ["Poppins-ExtraBold", "sans-serif"],
        pblack: ["Poppins-Black", "sans-serif"],
      },
    },
  },
  plugins: [],
};
