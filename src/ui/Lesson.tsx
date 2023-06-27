import { MDXProvider } from "@mdx-js/preact"
import { ComponentChild, FunctionComponent } from "preact"

import HelloWorld from "../lessons/HelloWorld.mdx"
import * as HelloWorldMetadata from "../lessons/HelloWorld.mdx"

import { H1, Heading } from "./Heading"
import { EditorReader, EditorWrapper } from "./EditorWrapper"
import { FnBindings } from "../userExecutionContext/bindings"
import { MutableRef, useEffect, useMemo, useRef } from "preact/hooks"
import { Card } from "./Card"

export const lessons = [HelloWorld]

export interface LessonProps {
    bindings: FnBindings
}

export const Lesson: FunctionComponent<LessonProps> = ({
    bindings
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
        MainEditor: EditorWrapper
    }

    return (
        <article>
            <H1 className="mb-4">{(HelloWorldMetadata as any).title}</H1>
            <HelloWorld components={components} />
        </article>
    )
}
