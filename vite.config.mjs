import { defineConfig } from 'vite'

/**
 * @type {import('vite').UserConfig}
 */
export default defineConfig({
    server: {
        https: false,
        port: 4083,
        open: '/example/index.html'
    },
    build: {
        sourcemap: true,
        lib: {
            entry: 'src/js/core.mjs',
            formats: ['es', 'cjs', 'umd'],
            name: 'bomtable',
            fileName: 'lib',
        },
    },
})

