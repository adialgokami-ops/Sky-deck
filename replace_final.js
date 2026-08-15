const fs = require('fs');

const files = [
  'c:/Users/atile/Downloads/Sky/Sky/src/components/landing/Navbar.tsx',
  'c:/Users/atile/Downloads/Sky/Sky/src/components/landing/Hero.tsx',
  'c:/Users/atile/Downloads/Sky/Sky/src/components/landing/MobileCTA.tsx',
  'c:/Users/atile/Downloads/Sky/Sky/src/components/landing/FinalCTA.tsx',
  'c:/Users/atile/Downloads/Sky/Sky/src/components/landing/Footer.tsx'
];

// Let's use simple string replacement since we just want to replace exact class strings.
// But we need to make sure we don't double replace if we run it again.
const classMap = {
  'bg-[#0F0F12]': 'bg-[#FAF9F6] dark:bg-[#0F0F12]',
  'bg-[#0F0F12]/90': 'bg-white/90 dark:bg-[#0F0F12]/90',
  'bg-[#0F0F12]/95': 'bg-white/95 dark:bg-[#0F0F12]/95',
  'bg-[#0a0a0e]': 'bg-[#F0EDE6] dark:bg-[#0a0a0e]',
  'bg-white/[0.01]': 'bg-stone-50/80 dark:bg-white/[0.01]',
  'bg-white/[0.02]': 'bg-white dark:bg-white/[0.02]',
  'bg-white/[0.03]': 'bg-white dark:bg-white/[0.03]',
  
  // Note: we can just match ' bg-[#0F0F12] ' or by using regex boundaries properly.
  // Actually, we can split the file by ', ", and <code></code>, then within those strings split by spaces.
  // But wait, what if they use string interpolation like \g-[#0F0F12]/90 \\?
  // It's safer to just split by spaces, newlines, or quotes, replace, and join.
};

// Let's do regex with word boundary for standard characters, but since brackets are not word characters,
// we can use regex like /(?<=[\s"'])bg-\[\#0F0F12\](?=[\s"'])/g
// But Node JS regex supports lookbehind.
// Let's write a powerful replace logic:
