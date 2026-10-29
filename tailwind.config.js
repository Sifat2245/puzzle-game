import { createRequire } from 'module';

const require = createRequire(import.meta.url);

export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: { sans: ['Hind Siliguri', 'sans-serif'], mono: ['Hind Siliguri', 'monospace'] },
    },
  },
  plugins: [],
};
