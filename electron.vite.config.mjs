import { defineConfig, externalizeDepsPlugin } from "electron-vite"

import wasm from "vite-plugin-wasm"
import topLevelAwait from "vite-plugin-top-level-await"

import preact from "@preact/preset-vite"

import mdx from "@mdx-js/rollup"
import smartypants from "remark-smartypants"
import remarkMdxImages from "remark-mdx-images"
import remarkMath from "remark-math"
import remarkGfm from "remark-gfm"
import rehypeKatex from "rehype-katex"
import { resolve } from "path"

// electron.vite.config.js
export default defineConfig({
    main: {
        plugins: [externalizeDepsPlugin()],
        build: {
            outDir: "out/main",
        },
    },
    preload: {
        plugins: [externalizeDepsPlugin()],
        build: {
            outDir: "out/preload",
        },
    },
    renderer: {
        server: {
            headers: {
                "Cross-Origin-Opener-Policy": "same-origin",
                "Cross-Origin-Embedder-Policy": "require-corp",
            },
        },
        plugins: [
            wasm(),
            topLevelAwait(),
            preact(),
            mdx({
                providerImportSource: "@mdx-js/preact",
                remarkPlugins: [smartypants, remarkMdxImages, remarkMath],
                rehypePlugins: [rehypeKatex],
            }),
        ],
        build: {
            outDir: "out/renderer",
            rollupOptions: {
                input: {
                    main: resolve(__dirname, "src", "renderer", "index.html"),
                },
            },
        },
    },
})
