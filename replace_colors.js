const fs = require('fs');

let content = fs.readFileSync('index.tsx', 'utf8');

// Replace colorful Tailwind classes with grayscale equivalents
const replacements = {
  'text-green-500': 'text-black',
  'text-yellow-500': 'text-black',
  'bg-green-400': 'bg-black',
  'bg-teal-50': 'bg-gray-100',
  'text-teal-800': 'text-black',
  'border-teal-200': 'border-gray-300',
  'hover:bg-teal-200': 'hover:bg-gray-200',
  'hover:text-red-700': 'hover:text-gray-600',
  'bg-indigo-100': 'bg-black',
  'text-indigo-600': 'text-white',
  'bg-green-500': 'bg-black',
  'hover:bg-green-600': 'hover:bg-gray-800',
  'text-blue-600': 'text-black',
  'text-green-600': 'text-black',
  'text-red-500': 'text-black',
  'bg-red-500/50': 'bg-black/50',
  'bg-red-900/80': 'bg-black/80',
  'text-blue-700': 'text-gray-600',
  'text-brand-blue': 'text-black',
  'accent-brand-blue': 'accent-black',
  'bg-red-100': 'bg-gray-200'
};

for (const [oldClass, newClass] of Object.entries(replacements)) {
  content = content.split(oldClass).join(newClass);
}

fs.writeFileSync('index.tsx', content);
console.log('Colors replaced successfully!');
