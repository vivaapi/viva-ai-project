import fs from 'fs';

let content = fs.readFileSync('index.tsx', 'utf-8');

content = content.replace(/bg-teal-50/g, 'bg-white');
content = content.replace(/hover:bg-teal-200/g, 'hover:bg-white');
content = content.replace(/border-teal-200/g, 'border-black');

fs.writeFileSync('index.tsx', content);
console.log('Replacement complete.');
