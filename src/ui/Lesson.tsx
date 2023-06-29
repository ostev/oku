import { MDXProvider } from "@mdx-js/preact"
import { ComponentChild, FunctionComponent, FunctionalComponent } from "preact"

import PopConcert from "../lessons/PopConcert.mdx"
import * as PopConcertMetadata from "../lessons/PopConcert.mdx"

import { H1, Heading } from "./Heading"
import { EditorReader, EditorWrapper } from "./EditorWrapper"
import { FnBindings } from "../userExecutionContext/bindings"
import { MutableRef, useEffect, useMemo, useRef } from "preact/hooks"
import { Card } from "./Card"
import { Paragraph } from "./Paragraph"

export const FunFact: FunctionalComponent = ({ children }) => (
    <div class="bg-slate-200 bg-opacity-40 backdrop-blur-sm m-1 my-3 p-3 rounded-lg">
        <Heading level={3}>Fun fact! 💡</Heading>
        {children}
    </div>
)

export const DocLink: FunctionalComponent<{ symbol: string }> = ({
    children,
    symbol,
}) => (
    <a href={`/${symbol}`}>
        <em>{children}</em> 📃
    </a>
)

export const Ref: FunctionalComponent<{ chapter: number; section: number }> = ({
    children,
    chapter,
    section,
}) => <a href={`/${chapter}/${section}`}>{children}</a>

export const YourTurn: FunctionalComponent = ({ children }) => (
    <div>
        <Heading level={2}>Your turn!</Heading>
        {children}
    </div>
)

export const Challenge: FunctionalComponent<{
    difficulty: "easy" | "medium" | "hard"
}> = ({ children, difficulty }) => {
    let difficultyEmoji

    if (difficulty == "easy") {
        difficultyEmoji = "🟩"
    } else if (difficulty == "medium") {
        difficultyEmoji = "🟧"
    } else {
        difficultyEmoji = "🟥"
    }

    return (
        <div class="my-4 ml-4">
            <Heading level={3}>🎯{difficultyEmoji} Challenge</Heading>{" "}
            {children}
        </div>
    )
}

export const Goal: FunctionalComponent = ({ children }) => {
    return (
        <div class="my-4 ml-4">
            <Heading level={3}>🎯 Goal</Heading>
            {children}
        </div>
    )
}

export const lessons = [PopConcert]

export interface LessonProps {
    bindings: FnBindings
}

export const Lesson: FunctionComponent<LessonProps> = ({
    bindings,
}: LessonProps) => {
    const pre: FunctionComponent = ({ children }) => {
        const readerRef = useRef(new EditorReader())

        let initialCode

        if (typeof children === "object") {
            initialCode = (children as any).props.children
        } else if (typeof children === "string") {
            initialCode = children
        } else {
            initialCode = "⚠️ Invalid children ⚠️"
        }
        initialCode += "\n"

        return (
            <EditorWrapper
                bindings={bindings}
                initialCode={initialCode}
                readerRef={readerRef}
            />
        )
    }

    const components = {
        h1: H1,
        pre,
        MainEditor: EditorWrapper,
        FunFact: FunFact,
        p: Paragraph,
        DocLink: DocLink,
        YourTurn: YourTurn,
        Challenge,
        Goal,
        Hint: Paragraph,
        Ref,
    }

    return (
        <article>
            <H1 className="mb-4">{(PopConcertMetadata as any).title}</H1>
            <MDXProvider components={components}>
                <PopConcert />
            </MDXProvider>
        </article>
    )
}
