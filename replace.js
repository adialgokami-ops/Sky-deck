const fs = require('fs');

const files = [
  'c:/Users/atile/Downloads/Sky/Sky/src/components/landing/Navbar.tsx',
  'c:/Users/atile/Downloads/Sky/Sky/src/components/landing/Hero.tsx',
  'c:/Users/atile/Downloads/Sky/Sky/src/components/landing/MobileCTA.tsx',
  'c:/Users/atile/Downloads/Sky/Sky/src/components/landing/FinalCTA.tsx',
  'c:/Users/atile/Downloads/Sky/Sky/src/components/landing/Footer.tsx'
];

const replacements = [
  [/bg-\\[#0F0F12\\](?!\/)/g, 'bg-[#FAF9F6] dark:bg-[#0F0F12]'],
  [/bg-\\[#0a0a0e\\]/g, 'bg-[#F0EDE6] dark:bg-[#0a0a0e]'],
  [/bg-white\/\\[0\.01\\]/g, 'bg-stone-50/80 dark:bg-white/[0.01]'],
  [/bg-white\/\\[0\.02\\]/g, 'bg-white dark:bg-white/[0.02]'],
  [/bg-white\/\\[0\.03\\]/g, 'bg-white dark:bg-white/[0.03]'],
  [/bg-white\/5(?!\d)/g, 'bg-stone-100 dark:bg-white/5'],
  [/bg-white\/10(?!\d)/g, 'bg-stone-100 dark:bg-white/10'],
  [/bg-\\[#0F0F12\\]\/90/g, 'bg-white/90 dark:bg-[#0F0F12]/90'],
  [/bg-\\[#0F0F12\\]\/95/g, 'bg-white/95 dark:bg-[#0F0F12]/95'],
  
  [/(?<!\S)text-white(?!\/)/g, 'text-stone-900 dark:text-white'],
  [/text-white\/90(?!\d)/g, 'text-stone-800 dark:text-white/90'],
  [/text-white\/70(?!\d)/g, 'text-stone-600 dark:text-white/70'],
  [/text-white\/60(?!\d)/g, 'text-stone-500 dark:text-white/60'],
  [/text-white\/50(?!\d)/g, 'text-stone-500 dark:text-white/50'],
  [/text-white\/45(?!\d)/g, 'text-stone-500 dark:text-white/45'],
  [/text-white\/40(?!\d)/g, 'text-stone-400 dark:text-white/40'],
  [/text-white\/30(?!\d)/g, 'text-stone-400 dark:text-white/30'],
  [/text-white\/20(?!\d)/g, 'text-stone-300 dark:text-white/20'],
  
  [/border-white\/5(?!\d)/g, 'border-stone-200 dark:border-white/5'],
  [/border-white\/10(?!\d)/g, 'border-stone-200 dark:border-white/10'],
  [/border-white\/15(?!\d)/g, 'border-stone-300/50 dark:border-white/15'],
  
  [/(?<!\S)text-gold-400(?!\/)/g, 'text-gold-600 dark:text-gold-400'],
  [/text-gold-400\/70(?!\d)/g, 'text-gold-600 dark:text-gold-400/70'],
  [/bg-gold-400\/10(?!\d)/g, 'bg-gold-100 dark:bg-gold-400/10'],
  [/bg-gold-400\/5(?!\d)/g, 'bg-gold-50 dark:bg-gold-400/5'],
  [/border-gold-400\/20(?!\d)/g, 'border-gold-200 dark:border-gold-400/20'],
  [/border-gold-400\/10(?!\d)/g, 'border-gold-200 dark:border-gold-400/10'],
  
  [/shadow-gold-400\/20(?!\d)/g, 'shadow-gold-600/15 dark:shadow-gold-400/20'],
  [/hover:shadow-gold-400\/30(?!\d)/g, 'hover:shadow-gold-600/20 dark:hover:shadow-gold-400/30'],
  [/(?<!hover:)shadow-gold-400\/30(?!\d)/g, 'shadow-gold-600/20 dark:shadow-gold-400/30'],
  
  [/hover:bg-white\/\\[0\.03\\]/g, 'hover:bg-stone-50 dark:hover:bg-white/[0.03]'],
  [/hover:bg-white\/\\[0\.04\\]/g, 'hover:bg-stone-100/50 dark:hover:bg-white/[0.04]'],
  [/hover:bg-white\/5(?!\d)/g, 'hover:bg-stone-100 dark:hover:bg-white/5'],
  [/hover:bg-white\/10(?!\d)/g, 'hover:bg-stone-100 dark:hover:bg-white/10'],
  [/hover:text-white(?!\/)/g, 'hover:text-stone-900 dark:hover:text-white'],
  [/hover:text-white\/60(?!\d)/g, 'hover:text-stone-600 dark:hover:text-white/60'],
  [/hover:border-white\/10(?!\d)/g, 'hover:border-stone-300 dark:hover:border-white/10'],
  [/hover:border-white\/30(?!\d)/g, 'hover:border-stone-300 dark:hover:border-white/30'],
  [/hover:border-gold-400\/20(?!\d)/g, 'hover:border-gold-300 dark:hover:border-gold-400/20'],
  [/hover:border-gold-400\/30(?!\d)/g, 'hover:border-gold-300 dark:hover:border-gold-400/30'],
  [/hover:bg-gold-400\/5(?!\d)/g, 'hover:bg-gold-50 dark:hover:bg-gold-400/5'],
  [/hover:text-gold-400(?!\/)/g, 'hover:text-gold-600 dark:hover:text-gold-400'],
  [/hover:text-gold-300(?!\/)/g, 'hover:text-gold-700 dark:hover:text-gold-300'],
  
  [/shadow-lg shadow-black\/20(?!\d)/g, 'shadow-lg shadow-stone-300/40 dark:shadow-black/20'],
  
  // Hero specific
  [/from-\\[#1a1510\\]/g, 'from-[#F5F0E8] dark:from-[#1a1510]'],
  [/via-\\[#0F0F12\\]/g, 'via-[#FAF9F6] dark:via-[#0F0F12]'],
  [/to-\\[#0F0F12\\]/g, 'to-[#FAF9F6] dark:to-[#0F0F12]'],
  [/from-\\[#0F0F12\\]/g, 'from-[#FAF9F6] dark:from-[#0F0F12]'],
  [/bg-amber-500\/\\[0\.04\\]/g, 'bg-amber-100/20 dark:bg-amber-500/[0.04]'],
  [/bg-emerald-400/g, 'bg-emerald-500 dark:bg-emerald-400'],
  
  // FinalCTA specific
  [/from-gold-900\/30(?!\d)/g, 'from-gold-100/80 dark:from-gold-900/30'],
  [/via-gold-800\/20(?!\d)/g, 'via-gold-50/60 dark:via-gold-800/20'],
  [/to-gold-900\/30(?!\d)/g, 'to-gold-100/80 dark:to-gold-900/30'],
];

for (const file of files) {
  if (fs.existsSync(file)) {
    let content = fs.readFileSync(file, 'utf8');
    for (const [regex, replacement] of replacements) {
      content = content.replace(regex, replacement);
    }
    fs.writeFileSync(file, content);
    console.log('Processed ' + file);
  } else {
    console.error('Not found: ' + file);
  }
}
