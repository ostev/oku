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

export class Editor {
    private view: EditorView
    private userExecutionContext: UserExecutionContext

    world: World
    player: Entity
    playerCharacterController: Rapier.KinematicCharacterController
    playerRigidBody: Rapier.RigidBody

    constructor(parent: Element, executionParent: Element, world: World) {
        this.world = world
        this.player = addPlayer(world)
        this.playerRigidBody = (
            getComponent(this.player, "rigidBody") as RigidBody
        ).rigidBody
        this.playerCharacterController = (
            getComponent(
                this.player,
                "characterController"
            ) as CharacterController
        ).characterController

        this.view = new EditorView({
            extensions: [basicSetup, javascript()],
            parent
        })
        this.userExecutionContext = new UserExecutionContext(executionParent, {
            helloThere: { fn: () => console.log("Hi!") },
            forward: {
                fn: (duration: number) => {
                    // this.playerRigidBody.rigidBody.addForce(
                    //     new Rapier.Vector3(25, 0, 0),
                    //     true
                    // )
                    // setTimeout(
                    //     () => this.playerRigidBody.rigidBody.resetForces(true),
                    //     duration * 1000
                    // )
                    // const joint = (getComponent(this.player, "joint") as Joint)
                    //     .joint as Rapier.RevoluteImpulseJoint
                    // joint.configureMotorVelocity(20, 0.5)
                    // setTimeout(
                    //     () => joint.configureMotorVelocity(0, 0.5),
                    //     duration * 1000
                    // )

                    this.world.playerMovementVector.y += 0.1

                    setTimeout(() => {
                        this.world.playerMovementVector.y -= 0.1
                    }, duration * 1000)
                }
            }
        })
    }

    public get script(): string {
        return this.view.state.doc.toString()
    }

    run = async () => {
        this.userExecutionContext.evalAsync(this.script)
    }
}
