import { MutableRef, useEffect, useRef, useState } from "preact/hooks"
import { Editor } from "../Editor"
import { FnBindings } from "../userExecutionContext/bindings"
import { NotYetImplementedError, error } from "../helpers"
import { FunctionComponent } from "preact"

const EditorRefsNotInitialisedError = error("EditorRefsNotInitialisedError")

export class EditorReader {
    private editor: Editor | undefined

    read = (): string => {
        if (this.editor === undefined) {
            return ""
        } else {
            return this.editor.code
        }
    }

    setEditor = (editor: Editor) => {
        this.editor = editor
    }
}

export interface EditorWrapperProps {
    bindings: FnBindings
    initialCode: string
    readerRef: MutableRef<EditorReader>
}

export interface EditorToolbarProps {
    run: () => void
    prettify: () => void
}

export const EditorToolbar: FunctionComponent<EditorToolbarProps> = ({
    run,
    prettify,
}) => {
    return (
        <div class="relative flex rounded-md shadow-md bg-slate-200 bg-opacity-60 backdrop-blur-sm h-10 p-4 items-center justify-end">
            <button class="mr-5" onClick={run}>
                Run!
            </button>
            <button class="mr-2" onClick={prettify}>
                Prettify!
            </button>
        </div>
    )
}

export const EditorWrapper: FunctionComponent<EditorWrapperProps> = ({
    bindings,
    initialCode,
    readerRef,
}) => {
    const editorParent: MutableRef<HTMLDivElement | null> = useRef(null)
    const executionContextParent: MutableRef<HTMLDivElement | null> =
        useRef(null)

    let editorRef: MutableRef<Editor | null> = useRef(null)

    useEffect(() => {
        console.log("Update")
        if (
            editorParent.current !== null &&
            executionContextParent.current !== null
        ) {
            editorRef.current = new Editor(
                editorParent.current,
                executionContextParent.current,
                bindings
            )

            editorRef.current.code = initialCode

            if (readerRef !== undefined) {
                readerRef.current.setEditor(editorRef.current)
            }
        } else {
            throw new EditorRefsNotInitialisedError(
                "Attempted to initialise editor before the component was mounted."
            )
        }

        return () => {
            editorRef.current?.destroy()
        }
    }, [])

    // useEffect(() => {
    //     if (editorRef.current !== null) {
    //         editorRef.current.code = code
    //     }
    // }, [code])

    // useEffect(() => {
    //     throw new NotYetImplementedError(
    //         "Updating bindings is not currently supported."
    //     )
    // }, [bindings])

    const run = () => {
        editorRef.current?.run()
    }

    return (
        <div class="w-full">
            <div class="mb-2">
                <EditorToolbar run={run} prettify={() => {}} />
            </div>
            <div ref={editorParent}></div>
            <div ref={executionContextParent}></div>
        </div>
    )
}
