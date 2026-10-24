export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        void: '#000000',
        panel: '#080808',
        surface: '#111111',
        edge: '#1f1f1f',
        line: '#2a2a2a',
        muted: '#8a8a8a',
        dim: '#5a5a5a',
        accent: '#ffffff',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['"Space Grotesk"', 'Inter', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
      },
      boxShadow: {
        glow: '0 0 60px -18px rgba(255,255,255,0.45)',
        white: '0 0 30px -10px rgba(255,255,255,0.30)',
        inset: 'inset 0 1px 0 0 rgba(255,255,255,0.05)',
      },
      keyframes: {
        marquee: { '0%': { transform: 'translateX(0)' }, '100%': { transform: 'translateX(-50%)' } },
        float: { '0%,100%': { transform: 'translateY(0)' }, '50%': { transform: 'translateY(-8px)' } },
        pulseGlow: { '0%,100%': { opacity: 0.4 }, '50%': { opacity: 1 } },
        sweep: { '0%': { transform: 'translateX(-120%)' }, '100%': { transform: 'translateX(120%)' } },
      },
      animation: {
        float: 'float 6s ease-in-out infinite',
        pulseGlow: 'pulseGlow 3s ease-in-out infinite',
        marquee: 'marquee 40s linear infinite',
        sweep: 'sweep 3.5s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};
