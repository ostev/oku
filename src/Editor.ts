import * as Rapier from "@dimforge/rapier3d"

import { EditorView, basicSetup } from "codemirror"
import { javascript } from "@codemirror/lang-javascript"

import { UserExecutionContext } from "./userExecutionContext/UserExecutionContext"
import {
    CharacterController,
    Entity,
    Joint,
    RigidBody,
    World,
    getComponent
} from "./World"
import { addPlayer } from "./Player"
import { FnBindings } from "./userExecutionContext/bindings"

export class Editor {
    private view: EditorView
    private userExecutionContext: UserExecutionContext

    player: Entity | undefined
    playerCharacterController: Rapier.KinematicCharacterController | undefined
    playerRigidBody: Rapier.RigidBody | undefined

    constructor(
        parent: Element,
        executionParent: Element,
        bindings: FnBindings
    ) {
        // this.world = world
        // addPlayer(world).then((player) => {
        //     this.player = player
        //     this.playerRigidBody = (
        //         getComponent(this.player, "rigidBody") as RigidBody
        //     ).rigidBody
        //     this.playerCharacterController = (
        //         getComponent(
        //             this.player,
        //             "characterController"
        //         ) as CharacterController
        //     ).characterController
        // })

        this.view = new EditorView({
            extensions: [basicSetup, javascript()],
            parent
        })
        this.userExecutionContext = new UserExecutionContext(
            executionParent,
            bindings
        )
        // helloThere: { fn: () => console.log("Hi!") },
        // forward: {
        //     fn: (duration: number) => {
        //         // this.playerRigidBody.rigidBody.addForce(
        //         //     new Rapier.Vector3(25, 0, 0),
        //         //     true
        //         // )
        //         // setTimeout(
        //         //     () => this.playerRigidBody.rigidBody.resetForces(true),
        //         //     duration * 1000
        //         // )
        //         // const joint = (getComponent(this.player, "joint") as Joint)
        //         //     .joint as Rapier.RevoluteImpulseJoint
        //         // joint.configureMotorVelocity(20, 0.5)
        //         // setTimeout(
        //         //     () => joint.configureMotorVelocity(0, 0.5),
        //         //     duration * 1000
        //         // )

        //         this.world.playerMovementVector.y += 0.1

        //         setTimeout(() => {
        //             this.world.playerMovementVector.y -= 0.1
        //         }, duration * 1000)
        //     }
        // }
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
                    insert: newCode
                }
            })
        }
    }

    destroy = () => {
        this.view.destroy()
        this.userExecutionContext.destroy()
    }

    run = async () => {
        this.userExecutionContext.evalAsync(this.code)
    }

    sendMessageToExecutionContext = (msg: string) => {
        this.userExecutionContext.sendMessage(msg)
    }
}
