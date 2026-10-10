import { defineConfig } from "vite"

import wasm from "vite-plugin-wasm"

import preact from "@preact/preset-vite"

import mdx from "@mdx-js/rollup"
import smartypants from "remark-smartypants"
import remarkMdxImages from "remark-mdx-images"
import remarkMath from "remark-math"
import remarkGfm from "remark-gfm"
import rehypeKatex from "rehype-katex"
import { resolve } from "path"
import netlify from "@netlify/vite-plugin"

export default defineConfig({
    server: {
        headers: {
            "Cross-Origin-Opener-Policy": "same-origin",
            "Cross-Origin-Embedder-Policy": "require-corp",
        },
    },
    plugins: [
        netlify(),
        wasm(),
        preact(),
        mdx({
            providerImportSource: "@mdx-js/preact",
            remarkPlugins: [
                smartypants,
                remarkMdxImages,
                remarkMath,
                remarkGfm,
            ],
            rehypePlugins: [rehypeKatex],
        }),
    ],
    build: {
        rollupOptions: {
            input: {
                main: resolve(import.meta.dirname, "index.html"),
            },
        },
    },
})
