import { defineConfig } from 'vite'

export default defineConfig({
    server: {
        https: false,
        port: 4083,
        open: '/example/index.html',
    },
    build: {
        target: 'es2020',
        sourcemap: true,
        lib: {
            entry: 'src/Bomtable.ts',
            name: 'bomtable',
            fileName: 'lib',
        },
    },
})
