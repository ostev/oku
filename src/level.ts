import * as Rapier from "@dimforge/rapier3d"
import * as Three from "three"
import { Transform, World } from "./World"

// export interface Level<Model> {
//     update: (time: number, player: Player) => Model
//     view: (model: Model) => LevelNode[]
// }

// export type LevelNode = Group | Block

// export const enum LevelNodeKind {
//     Group = 0,
//     Block = 1
// }

// export type Group = [LevelNodeKind.Group, LevelNode[]]

// export type Block = [LevelNodeKind.Block, Dimensions]

export interface Dimensions {
    width: number
    height: number
    depth: number
}

export const addBox = (
    world: World,
    transform: Transform,
    dimensions: Dimensions,
    rigidBodyDesc: Rapier.RigidBodyDesc,
    color: Three.ColorRepresentation
) => {
    return world.addEntity(
        transform,
        new Set([
            {
                kind: "rigidBodyDesc",
                rigidBodyDesc,
                colliderDesc: new Rapier.ColliderDesc(
                    new Rapier.Cuboid(
                        dimensions.width / 2,
                        dimensions.height / 2,
                        dimensions.depth / 2
                    )
                )
            },
            {
                kind: "mesh",
                mesh: new Three.Mesh(
                    new Three.BoxGeometry(
                        dimensions.width,
                        dimensions.height,
                        dimensions.depth
                    ),
                    new Three.MeshBasicMaterial({
                        color
                    })
                )
            }
        ])
    )
}

// export interface Inputs {
//     mouse: Mouse
// }

// export interface Mouse {
//     position: Vec2
//     leftButton: boolean
//     rightButton: boolean
//     middleButton: boolean
// }
