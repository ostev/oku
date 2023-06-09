import { EditorView, basicSetup } from "codemirror"
import { javascript } from "@codemirror/lang-javascript"
import { UserExecutionContext } from "./userExecutionContext/UserExecutionContext"

export class Editor {
    private view: EditorView
    private userExecutionContext: UserExecutionContext

    constructor(parent: Element, executionParent: Element) {
        this.view = new EditorView({
            extensions: [basicSetup, javascript()],
            parent
        })
        this.userExecutionContext = new UserExecutionContext(executionParent, {
            helloThere: { fn: () => console.log("Hi!"), sync: { delay: 1000 } }
        })
    }

    public get script(): string {
        return this.view.state.doc.toString()
    }

    run = async () => {
        this.userExecutionContext.evalAsync(this.script)
    }
}
