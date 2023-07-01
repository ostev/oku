import {
    ComponentChild,
    FunctionComponent,
    FunctionalComponent,
    h,
} from "preact"

import * as Quotes from "../lessons/docs/Quotes.mdx"
import { Tooltip } from "./Tooltip"

const createDoc = (module: typeof Quotes) => {
    return {
        full: module.default,
        summary: (module as any).summary,
    }
}

export const docs: Record<
    string,
    { full: FunctionComponent; summary: FunctionComponent }
> = {
    quotes: createDoc(Quotes),
}

export const DocLink: FunctionComponent<{
    symbol: string
    tooltip?: boolean
}> = ({ children, symbol, tooltip }) => {
    const doc = docs[symbol]
    const content = doc ? h(doc.summary, null) : <span>Docs not found.</span>

    const link = (
        <a href={`/docs/${symbol}`} class="text-slate-900 font-bold">
            {children}
        </a>
    )

    return tooltip === undefined || tooltip === true ? (
        <Tooltip content={content}>{link}</Tooltip>
    ) : (
        link
    )
}
