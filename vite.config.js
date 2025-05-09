import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'

import { cloudflare } from "@cloudflare/vite-plugin"
import vuetify from 'vite-plugin-vuetify'

// https://vite.dev/config/
export default defineConfig({
	plugins: [
		vue(),
    vuetify({ autoImport: true }),
		vueDevTools(),
		cloudflare(),
	],
	resolve: {
		alias: {
			'@': fileURLToPath(new URL('./src', import.meta.url)),
		},
	},
})
