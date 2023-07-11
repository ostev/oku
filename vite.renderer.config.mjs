import { defineConfig } from "vite"

import wasm from "vite-plugin-wasm"
import topLevelAwait from "vite-plugin-top-level-await"

import preact from "@preact/preset-vite"

import mdx from "@mdx-js/rollup"
import smartypants from "remark-smartypants"
import remarkMdxImages from "remark-mdx-images"
import remarkMath from "remark-math"
import rehypeKatex from "rehype-katex"
import { resolve } from "path"

export default defineConfig({
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
})
