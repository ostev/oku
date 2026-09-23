import * as Rapier from "@dimforge/rapier3d"

import { EditorView, basicSetup } from "codemirror"
import { javascript } from "@codemirror/lang-javascript"

import { dracula } from "thememirror"

import { Entity } from "./World"

export class Editor {
    private view: EditorView

    player: Entity | undefined
    playerCharacterController: Rapier.KinematicCharacterController | undefined
    playerRigidBody: Rapier.RigidBody | undefined

    constructor(parent: Element) {
        this.view = new EditorView({
            extensions: [basicSetup, javascript(), dracula],
            parent,
        })
    }

    get code(): string {
        return this.view.state.doc.toString()
    }

    set code(newCode: string) {
        if (newCode !== this.code) {
            this.view.dispatch({
                changes: {
                    from: 0,
                    to: this.view.state.doc.length,
                    insert: newCode,
                },
            })
        }
    }

    get domElement(): HTMLElement {
        return this.view.dom
    }

    destroy = () => {
        this.view.destroy()
        // this.userExecutionContext.destroy()
    }

    // run = async () => {
    //     this.userExecutionContext.evalAsync(this.code)
    // }

    // sendMessageToExecutionContext = (msg: string) => {
    //     this.userExecutionContext.sendMessage(msg)
    // }

    // resumeExecution = () => {
    //     this.userExecutionContext.resume()
    // }
}
