import { EditorView, basicSetup } from "codemirror"
import { javascript } from "@codemirror/lang-javascript"

export class Editor {
    view: EditorView

    constructor(parent: Element) {
        this.view = new EditorView({
            extensions: [basicSetup, javascript()],
            parent
        })
    }
}
