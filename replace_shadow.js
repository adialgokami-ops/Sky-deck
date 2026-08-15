const fs = require('fs');

const files = [
  'c:/Users/atile/Downloads/Sky/Sky/src/components/landing/Navbar.tsx',
  'c:/Users/atile/Downloads/Sky/Sky/src/components/landing/Hero.tsx',
  'c:/Users/atile/Downloads/Sky/Sky/src/components/landing/MobileCTA.tsx',
  'c:/Users/atile/Downloads/Sky/Sky/src/components/landing/FinalCTA.tsx',
  'c:/Users/atile/Downloads/Sky/Sky/src/components/landing/Footer.tsx'
];

for (const file of files) {
  if (fs.existsSync(file)) {
    let content = fs.readFileSync(file, 'utf8');
    // Find things like className="..." that contain border and bg-[#FAF9F6] or similar
    const matches = content.match(/className="([^"]+)"/g);
    let modified = false;
    if (matches) {
      for (const match of matches) {
        if (match.includes('border') && 
            (match.includes('bg-[#FAF9F6]') || match.includes('bg-[#F0EDE6]') || match.includes('bg-stone-50'))) {
          // If it doesn't already have shadow-sm
          if (!match.includes('shadow-sm dark:shadow-none')) {
            const newMatch = match.replace('className="', 'className="shadow-sm dark:shadow-none ');
            content = content.replace(match, newMatch);
            modified = true;
          }
        }
      }
    }
    if (modified) {
      fs.writeFileSync(file, content);
      console.log('Added shadow-sm to ' + file);
    }
  }
}
