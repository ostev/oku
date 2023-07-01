import { MDXProvider } from "@mdx-js/preact"
import {
    Component,
    ComponentChild,
    FunctionComponent,
    FunctionalComponent,
    h,
} from "preact"

import HelloWorld from "../lessons/HelloWorld.mdx"
import * as HelloWorldMetadata from "../lessons/HelloWorld.mdx"

import { H1, Heading } from "./Heading"
import { EditorReader, EditorWrapper } from "./EditorWrapper"
import { FnBindings } from "../userExecutionContext/bindings"
import { MutableRef, useEffect, useMemo, useRef } from "preact/hooks"
import { Card } from "./Card"
import { Paragraph } from "./Paragraph"
import { Level } from "../level/Level"
import { World } from "../World"
import { DocLink } from "./Docs"

export const FunFact: FunctionalComponent = ({ children }) => (
    <div class="bg-slate-200 bg-opacity-40 backdrop-blur-sm m-1 my-3 p-3 rounded-lg">
        <Heading level={3}>Fun fact! 💡</Heading>
        {children}
    </div>
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

export const lessons = [HelloWorld]

export interface LessonInfo {
    title: string
    chapter: number
    section: number
    content: FunctionComponent
}

export interface LessonProps {
    bindings: FnBindings
    info: LessonInfo
}

export const Lesson: FunctionComponent<LessonProps> = ({
    info,
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
        FunFact,
        p: Paragraph,
        DocLink,
        YourTurn,
        Challenge,
        Goal,
        Hint: Paragraph,
        Ref,
    }

    return (
        <article>
            <H1 className="mb-4">{info.title}</H1>
            <MDXProvider components={components}>
                {h(info.content, {})}
            </MDXProvider>
        </article>
    )
}
