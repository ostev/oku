import { MutableRef, useEffect, useRef, useState } from "preact/hooks"
import { Editor } from "../Editor"
import { FnBindings } from "../userExecutionContext/bindings"
import { NotYetImplementedError, error } from "../helpers"

const EditorRefsNotInitialisedError = error("EditorRefsNotInitialisedError")

export interface EditorWrapperProps {
    bindings: FnBindings
}

export const EditorWrapper = ({ bindings }: EditorWrapperProps) => {
    const editorParent: MutableRef<HTMLDivElement | null> = useRef(null)
    const executionContextParent: MutableRef<HTMLDivElement | null> =
        useRef(null)

    let editorRef: MutableRef<Editor | null> = useRef(null)

    useEffect(() => {
        if (
            editorParent.current !== null &&
            executionContextParent.current !== null
        ) {
            editorRef.current = new Editor(
                editorParent.current,
                executionContextParent.current,
                bindings
            )
        } else {
            throw new EditorRefsNotInitialisedError(
                "Attempted to initialise editor before the component was mounted."
            )
        }

        return () => {
            editorRef.current?.destroy()
        }
    })

    // useEffect(() => {
    //     throw new NotYetImplementedError(
    //         "Updating bindings is not currently supported."
    //     )
    // }, [bindings])

    return (
        <div>
            <div ref={editorParent}></div>
            <div ref={executionContextParent}></div>
        </div>
    )
}
