import fs from 'fs';

let content = fs.readFileSync('index.tsx', 'utf-8');

// Replace text colors
content = content.replace(/text-brand-(red|blue|purple|green|yellow|pink|cream)/g, 'text-black');
content = content.replace(/text-slate-\d+/g, 'text-black');
content = content.replace(/text-gray-\d+/g, 'text-black');
content = content.replace(/text-zinc-\d+/g, 'text-black');
content = content.replace(/text-neutral-\d+/g, 'text-black');
content = content.replace(/text-red-\d+/g, 'text-black');
content = content.replace(/text-green-\d+/g, 'text-black');
content = content.replace(/text-blue-\d+/g, 'text-black');
content = content.replace(/text-yellow-\d+/g, 'text-black');
content = content.replace(/text-indigo-\d+/g, 'text-black');
content = content.replace(/text-teal-\d+/g, 'text-black');

// Replace hover:text-*
content = content.replace(/hover:text-brand-(red|blue|purple|green|yellow|pink|cream)/g, 'hover:text-black');
content = content.replace(/hover:text-slate-\d+/g, 'hover:text-black');
content = content.replace(/hover:text-gray-\d+/g, 'hover:text-black');
content = content.replace(/hover:text-red-\d+/g, 'hover:text-black');
content = content.replace(/hover:text-green-\d+/g, 'hover:text-black');
content = content.replace(/hover:text-blue-\d+/g, 'hover:text-black');

// Replace border colors
content = content.replace(/border-brand-(red|blue|purple|green|yellow|pink|cream)/g, 'border-black');
content = content.replace(/border-slate-\d+/g, 'border-black');
content = content.replace(/border-gray-\d+/g, 'border-black');
content = content.replace(/border-red-\d+/g, 'border-black');
content = content.replace(/border-green-\d+/g, 'border-black');
content = content.replace(/border-blue-\d+/g, 'border-black');

// Replace bg-brand-* again just in case
content = content.replace(/bg-brand-(red|blue|purple|green|yellow|pink|cream)/g, 'bg-white');

fs.writeFileSync('index.tsx', content);
console.log('Replacement complete.');
