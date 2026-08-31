import tailwindcss from '@tailwindcss/vite';
import adapter from '@sveltejs/adapter-node';
import { sveltekit } from '@sveltejs/kit/vite';
import { SvelteKitPWA } from '@vite-pwa/sveltekit';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [
		tailwindcss(),
		SvelteKitPWA({
			registerType: 'autoUpdate',
			manifest: {
				name: 'Recipes',
				short_name: 'Recipes',
				description: 'Personal recipe manager — capture, search, and log notes as you cook.',
				theme_color: '#ea580c',
				background_color: '#fafaf9',
				display: 'standalone',
				start_url: '/',
				icons: [
					{ src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
					{ src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
					{
						src: '/icons/icon-512-maskable.png',
						sizes: '512x512',
						type: 'image/png',
						purpose: 'maskable'
					}
				]
			},
			workbox: {
				// GET-only, read-heavy caching — write actions (POST form submissions)
				// are never intercepted, so this is a "snappier reloads" nicety only,
				// not offline write support.
				runtimeCaching: [
					{
						urlPattern: ({ request }) => request.method === 'GET',
						handler: 'StaleWhileRevalidate',
						options: { cacheName: 'pages' }
					}
				]
			}
		}),
		sveltekit({
			compilerOptions: {
				// Force runes mode for the project, except for libraries. Can be removed in svelte 6.
				runes: ({ filename }) => filename.split(/[/\\]/).includes('node_modules') ? undefined : true
			},

			// Render doesn't have adapter-auto detection, so we pin adapter-node explicitly.
			adapter: adapter(),

			typescript: {
				config: (config) => {
					config.include.push('../drizzle.config.ts');
				}
			}
		})
	]
});
