import {defineConfig} from 'vite';
import react from '@vitejs/plugin-react';
import tailwind from '@tailwindcss/vite';
export default defineConfig({plugins:[react(),tailwind()],define:{'process.env.NODE_ENV':JSON.stringify('production')},publicDir:false,build:{outDir:'dist/ui',emptyOutDir:false,lib:{entry:'src/buttons.tsx',formats:['es'],fileName:()=> 'hover-buttons.js',cssFileName:'hover-buttons'},minify:true,rolldownOptions:{output:{minify:true}}}});
