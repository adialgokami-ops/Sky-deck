const fs = require('fs');

const files = [
  'c:/Users/atile/Downloads/Sky/Sky/src/components/landing/Navbar.tsx',
  'c:/Users/atile/Downloads/Sky/Sky/src/components/landing/Hero.tsx',
  'c:/Users/atile/Downloads/Sky/Sky/src/components/landing/MobileCTA.tsx',
  'c:/Users/atile/Downloads/Sky/Sky/src/components/landing/FinalCTA.tsx',
  'c:/Users/atile/Downloads/Sky/Sky/src/components/landing/Footer.tsx'
];

const classMap = {
  'bg-[#0F0F12]': 'bg-[#FAF9F6] dark:bg-[#0F0F12]',
  'bg-[#0a0a0e]': 'bg-[#F0EDE6] dark:bg-[#0a0a0e]',
  'bg-white/[0.01]': 'bg-stone-50/80 dark:bg-white/[0.01]',
  'bg-white/[0.02]': 'bg-white dark:bg-white/[0.02]',
  'bg-white/[0.03]': 'bg-white dark:bg-white/[0.03]',
  'bg-white/5': 'bg-stone-100 dark:bg-white/5',
  'bg-white/10': 'bg-stone-100 dark:bg-white/10',
  'bg-[#0F0F12]/90': 'bg-white/90 dark:bg-[#0F0F12]/90',
  'bg-[#0F0F12]/95': 'bg-white/95 dark:bg-[#0F0F12]/95',
  
  'text-white': 'text-stone-900 dark:text-white',
  'text-white/90': 'text-stone-800 dark:text-white/90',
  'text-white/70': 'text-stone-600 dark:text-white/70',
  'text-white/60': 'text-stone-500 dark:text-white/60',
  'text-white/50': 'text-stone-500 dark:text-white/50',
  'text-white/45': 'text-stone-500 dark:text-white/45',
  'text-white/40': 'text-stone-400 dark:text-white/40',
  'text-white/30': 'text-stone-400 dark:text-white/30',
  'text-white/20': 'text-stone-300 dark:text-white/20',
  
  'border-white/5': 'border-stone-200 dark:border-white/5',
  'border-white/10': 'border-stone-200 dark:border-white/10',
  'border-white/15': 'border-stone-300/50 dark:border-white/15',
  
  'text-gold-400': 'text-gold-600 dark:text-gold-400',
  'text-gold-400/70': 'text-gold-600 dark:text-gold-400/70',
  'bg-gold-400/10': 'bg-gold-100 dark:bg-gold-400/10',
  'bg-gold-400/5': 'bg-gold-50 dark:bg-gold-400/5',
  'border-gold-400/20': 'border-gold-200 dark:border-gold-400/20',
  'border-gold-400/10': 'border-gold-200 dark:border-gold-400/10',
  
  'shadow-gold-400/20': 'shadow-gold-600/15 dark:shadow-gold-400/20',
  'hover:shadow-gold-400/30': 'hover:shadow-gold-600/20 dark:hover:shadow-gold-400/30',
  'shadow-gold-400/30': 'shadow-gold-600/20 dark:shadow-gold-400/30',
  
  'hover:bg-white/[0.03]': 'hover:bg-stone-50 dark:hover:bg-white/[0.03]',
  'hover:bg-white/[0.04]': 'hover:bg-stone-100/50 dark:hover:bg-white/[0.04]',
  'hover:bg-white/5': 'hover:bg-stone-100 dark:hover:bg-white/5',
  'hover:bg-white/10': 'hover:bg-stone-100 dark:hover:bg-white/10',
  'hover:text-white': 'hover:text-stone-900 dark:hover:text-white',
  'hover:text-white/60': 'hover:text-stone-600 dark:hover:text-white/60',
  'hover:border-white/10': 'hover:border-stone-300 dark:hover:border-white/10',
  'hover:border-white/30': 'hover:border-stone-300 dark:hover:border-white/30',
  'hover:border-gold-400/20': 'hover:border-gold-300 dark:hover:border-gold-400/20',
  'hover:border-gold-400/30': 'hover:border-gold-300 dark:hover:border-gold-400/30',
  'hover:bg-gold-400/5': 'hover:bg-gold-50 dark:hover:bg-gold-400/5',
  'hover:text-gold-400': 'hover:text-gold-600 dark:hover:text-gold-400',
  'hover:text-gold-300': 'hover:text-gold-700 dark:hover:text-gold-300',
  
  'shadow-lg shadow-black/20': 'shadow-lg shadow-stone-300/40 dark:shadow-black/20',
  
  'from-[#1a1510]': 'from-[#F5F0E8] dark:from-[#1a1510]',
  'via-[#0F0F12]': 'via-[#FAF9F6] dark:via-[#0F0F12]',
  'to-[#0F0F12]': 'to-[#FAF9F6] dark:to-[#0F0F12]',
  'from-[#0F0F12]': 'from-[#FAF9F6] dark:from-[#0F0F12]',
  'bg-amber-500/[0.04]': 'bg-amber-100/20 dark:bg-amber-500/[0.04]',
  'bg-emerald-400': 'bg-emerald-500 dark:bg-emerald-400',
  
  'from-gold-900/30': 'from-gold-100/80 dark:from-gold-900/30',
  'via-gold-800/20': 'via-gold-50/60 dark:via-gold-800/20',
  'to-gold-900/30': 'to-gold-100/80 dark:to-gold-900/30'
};

function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

for (const file of files) {
  if (fs.existsSync(file)) {
    let content = fs.readFileSync(file, 'utf8');
    
    for (const [cls, replacement] of Object.entries(classMap)) {
      const escaped = escapeRegExp(cls);
      const regex = new RegExp('(?<=[\\s"\'`])' + escaped + '(?=[\\s"\'`])', 'g');
      content = content.replace(regex, replacement);
    }
    
    // Also add shadow-sm to card containers that use border + bg-white in light mode
    // Specifically looking for class strings containing 'border' and ('bg-[#FAF9F6]' or 'bg-[#F0EDE6]' or 'bg-stone-50' or 'bg-white')
    // Wait, the safest way is to match `className="..."` or similar, check if it has border and one of the target light bg colors.
    const classRegex = /className=(['"])(.*?)\1|className=\{`(.*?)`\}/g;
    content = content.replace(classRegex, (match, p1, p2, p3) => {
      const classes = p2 || p3 || '';
      if (classes.includes('border') && !classes.includes('shadow-sm') && 
         (classes.includes('bg-[#FAF9F6]') || classes.includes('bg-[#F0EDE6]') || classes.includes('bg-stone-50'))) {
         
         if (p2) {
           return `className=${p1}shadow-sm dark:shadow-none ${p2}${p1}`;
         } else if (p3) {
           return `className={\`shadow-sm dark:shadow-none ${p3}\`}`;
         }
      }
      return match;
    });
    
    fs.writeFileSync(file, content);
    console.log('Processed ' + file);
  }
}
