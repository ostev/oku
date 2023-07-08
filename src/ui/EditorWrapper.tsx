import { MutableRef, useEffect, useRef, useState } from "preact/hooks"
import { Editor } from "../Editor"
import { FnBindings } from "../userExecutionContext/bindings"
import { NotYetImplementedError, error } from "../helpers"
import { ComponentChildren, FunctionComponent } from "preact"
import { Button } from "./Button"

const EditorNotInitialisedError = error("EditorNotInitialisedError")

export class EditorReadWriter {
    private editor: Editor | undefined

    read = (): string => {
        if (this.editor === undefined) {
            return ""
        } else {
            return this.editor.code
        }
    }

    write = (code: string) => {
        if (this.editor === undefined) {
            throw new EditorNotInitialisedError(
                "Cannot write to uninitialised editor."
            )
        } else {
            this.editor.code = code
        }
    }

    setEditor = (editor: Editor) => {
        this.editor = editor
    }
}

export interface EditorToolbarProps {
    run: () => void
    prettify: () => void
}

export const EditorToolbar: FunctionComponent<EditorToolbarProps> = ({
    run,
    prettify,
    children,
}) => {
    return (
        <div class="relative flex rounded-md shadow-md bg-slate-200 bg-opacity-60 backdrop-blur-sm h-10 p-4 items-center justify-end place-content-evenly">
            {children}
            <Button className="ml-5" onClick={run}>
                Run!
            </Button>
            {/* <button class="mr-2" onClick={prettify}>
                Prettify!
            </button> */}
        </div>
    )
}

export interface EditorWrapperProps {
    bindings: FnBindings
    initialCode: string
    readerRef?: MutableRef<EditorReadWriter>
    additionalToolbarItems?: ComponentChildren
    onExecutionError: (error: Error) => void
    onRun?: (code: string) => Promise<void>
    onFocus?: () => void
    onBlur?: () => void
}

export const EditorWrapper: FunctionComponent<EditorWrapperProps> = ({
    bindings,
    initialCode,
    readerRef,
    additionalToolbarItems,
    onExecutionError,
    onRun,
    onFocus,
    onBlur,
}) => {
    const editorParent: MutableRef<HTMLDivElement | null> = useRef(null)
    const executionContextParent: MutableRef<HTMLDivElement | null> =
        useRef(null)

    let editorRef: MutableRef<Editor | null> = useRef(null)

    // useEffect(()=>{
    //     if (editorParent.current !== null&&onBlur!==undefined) {
    //         editorParent.current.removeEventListener("blur")
    //     }
    // })

    useEffect(() => {
        if (
            editorParent.current !== null &&
            executionContextParent.current !== null
        ) {
            editorRef.current = new Editor(
                editorParent.current,
                executionContextParent.current,
                bindings,
                onExecutionError
            )

            const el =
                editorRef.current.domElement.getElementsByClassName(
                    "cm-content"
                )[0]

            if (onFocus !== undefined) {
                el.addEventListener("focus", onFocus)
            }
            if (onBlur !== undefined) {
                el.addEventListener("blur", onBlur)
            }

            editorRef.current.code = initialCode

            if (readerRef !== undefined) {
                readerRef.current.setEditor(editorRef.current)
            }

            return () => {
                editorRef.current?.destroy()
            }
        } else {
            throw new EditorNotInitialisedError(
                "Attempted to initialise editor before the component was mounted."
            )
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
                <EditorToolbar
                    run={() => {
                        if (onRun !== undefined && editorRef.current !== null) {
                            onRun(editorRef.current.code).then(() => {
                                run()
                            })
                        } else {
                            run()
                        }
                    }}
                    prettify={() => {}}
                >
                    {additionalToolbarItems}
                </EditorToolbar>
            </div>
            <div ref={editorParent}></div>
            <div ref={executionContextParent}></div>
        </div>
    )
}
