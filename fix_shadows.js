const fs = require('fs');

const heroPath = 'c:/Users/atile/Downloads/Sky/Sky/src/components/landing/Hero.tsx';
let hero = fs.readFileSync(heroPath, 'utf8');
hero = hero.replace('shadow-sm dark:shadow-none rounded-full', 'rounded-full');
fs.writeFileSync(heroPath, hero);

const footerPath = 'c:/Users/atile/Downloads/Sky/Sky/src/components/landing/Footer.tsx';
let footer = fs.readFileSync(footerPath, 'utf8');
footer = footer.replace('shadow-sm dark:shadow-none ', '');
fs.writeFileSync(footerPath, footer);
