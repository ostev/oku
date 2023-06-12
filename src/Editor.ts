import { EditorView, basicSetup } from "codemirror"
import { javascript } from "@codemirror/lang-javascript"
import { UserExecutionContext } from "./userExecutionContext/UserExecutionContext"
import { World } from "./World"

export class Editor {
    private view: EditorView
    private userExecutionContext: UserExecutionContext

    world: World

    constructor(parent: Element, executionParent: Element, world: World) {
        this.world = world

        this.view = new EditorView({
            extensions: [basicSetup, javascript()],
            parent
        })
        this.userExecutionContext = new UserExecutionContext(executionParent, {
            helloThere: { fn: () => console.log("Hi!") }
        })
    }

    public get script(): string {
        return this.view.state.doc.toString()
    }

    run = async () => {
        this.userExecutionContext.evalAsync(this.script)
    }
}
