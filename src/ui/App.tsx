import { MutableRef, useRef } from "preact/hooks"
import { EditorWrapper } from "./EditorWrapper"
import { World } from "../World"

export const App = () => {
    const worldRef: MutableRef<World | null> = useRef(null)

    const bindings = {}

    return (
        <div>
            <h1>Hello there!</h1>
            <EditorWrapper bindings={bindings} />
        </div>
    )
}
