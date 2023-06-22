import * as Rapier from "@dimforge/rapier3d"
import * as Three from "three"

import { $, error, range, withDefault } from "./helpers"
import { intersection } from "./setHelpers"
import { View } from "./View"
import { distance } from "./maths"

export const MeshComponentNotFoundInThreeJSSceneError = error(
    "MeshComponentNotFoundInThreeJSSceneError"
)

export const ComponentNotFoundError = error("ComponentNotFoundError")

export const getComponent = <Kind extends ComponentKind>(
    entity: Readonly<Entity>,
    kind: Kind
): Component => {
    const component = entity.components.get(kind)

    if (component === undefined) {
        throw new ComponentNotFoundError(
            `Component ${kind} not found in entity ${entity.id}`
        )
    } else {
        if (component.kind === kind) {
            return component
        }
    }

    return undefined as any
}

export class World {
    private entities: Map<EntityId, Entity> = new Map()
    private componentLookupTable: Map<ComponentKind, Set<EntityId>> = new Map()
    private idCount: EntityId = 0
    // private intervalHandle: number | undefined
    private animRequestHandle: number | undefined
    private time = 0

    playerMovementVector = new Rapier.Vector3(0, 0, 0)

    view: View
    physics: Rapier.World
    // keys: Record<string, boolean> = {}

    constructor(gravity: Readonly<Rapier.Vector3>, view: View) {
        this.physics = new Rapier.World(gravity)
        this.view = view
    }

    start = () => {
        // window.addEventListener("keydown", (ev) => {
        //     this.keys[ev.key] = true
        // })

        // window.addEventListener("keyup", (ev) => {
        //     this.keys[ev.key] = false
        // })

        // for (const entity of intersection(
        //     this.getEntities("rigidBody"),
        //     this.getEntities("hover")
        // )) {
        //     const rigidBody = (getComponent(entity, "rigidBody") as RigidBody)
        //         .rigidBody
        //     const targetAltitude = (getComponent(entity, "rigidBody") as Hover)
        //         .altitude

        //     console.log("hover")

        //     rigidBody.addForce({ x: 0, y: 40, z: 0 }, true)
        // }

        // this.intervalHandle = setInterval(this.fixedStep, 1 / 60)
        this.animate(0)
    }

    stop = () => {
        if (this.animRequestHandle !== undefined) {
            cancelAnimationFrame(this.animRequestHandle)
        } else {
            console.warn("Not currently animating.")
        }
        // clearInterval(this.intervalHandle)
        // this.intervalHandle = undefined
    }

    addEntity = (
        transform: Transform,
        components: ReadonlySet<Component>
    ): Entity => {
        this.idCount += 1

        const id = this.idCount
        const uninitialisedEntity = {
            id,
            components: Array.from(components).reduce(
                (accumulator: Map<ComponentKind, Component>, component) => {
                    accumulator.set(component.kind, component)
                    return accumulator
                },
                new Map()
            ),
            transform
        }

        const entity: Entity = {
            id,
            components: new Map(),
            transform
        }

        for (const [kind, component] of uninitialisedEntity.components) {
            const finalisedComponent = this.initComponent(
                uninitialisedEntity,
                component
            )

            entity.components.set(finalisedComponent.kind, finalisedComponent)
        }

        this.entities.set(id, entity)

        for (const [_kind, component] of entity.components) {
            const ids = this.componentLookupTable.get(component.kind)
            if (ids !== undefined) {
                ids.add(id)
            } else {
                const ids: Set<EntityId> = new Set()
                ids.add(id)
                this.componentLookupTable.set(component.kind, ids)
            }
        }

        return entity
    }

    getEntity = (id: Readonly<EntityId>): Readonly<Entity> | undefined => {
        return this.entities.get(id)
    }

    addComponentToEntity = (
        id: Readonly<EntityId>,
        component: Readonly<Component>
    ) => {
        const entity = this.entities.get(id) as Entity

        const finalisedComponent = this.initComponent(entity, component)

        entity.components.set(finalisedComponent.kind, finalisedComponent)

        const ids = this.componentLookupTable.get(finalisedComponent.kind)
        if (ids !== undefined) {
            ids.add(id)
        } else {
            const ids: Set<EntityId> = new Set()
            ids.add(id)
            this.componentLookupTable.set(finalisedComponent.kind, ids)
        }
    }

    private initComponent = (
        entity: Readonly<Entity>,
        component: Readonly<Component>
    ): Component => {
        if (component.kind === "rigidBodyDesc") {
            const rigidBody = this.physics.createRigidBody(
                component.rigidBodyDesc
            )
            const collider = this.physics.createCollider(
                component.colliderDesc,
                rigidBody
            )

            rigidBody.setTranslation(
                new Rapier.Vector3(
                    entity.transform.translation.x,
                    entity.transform.translation.y,
                    entity.transform.translation.z
                ),
                false
            )

            return { kind: "rigidBody", rigidBody, collider }
        } else if (component.kind === "mesh") {
            component.mesh.name = entity.id.toString()
            this.view.scene.add(component.mesh)

            return component
        } else {
            return component
        }
    }

    getEntities = (componentKind: Readonly<ComponentKind>): Set<Entity> => {
        const entities = new Set<Entity>()
        for (const entityId of withDefault(
            this.componentLookupTable.get(componentKind),
            new Set()
        )) {
            entities.add(this.entities.get(entityId) as Entity)
        }

        return entities
    }

    fixedStep = () => {
        this.fixedStepPlayer()
        this.physics.step()
    }

    step = (delta: number) => {
        for (const entity of intersection(
            this.getEntities("rigidBody"),
            this.getEntities("mesh")
        )) {
            const mesh = (entity.components.get("mesh") as Mesh).mesh
            const rigidBody = (entity.components.get("rigidBody") as RigidBody)
                .rigidBody

            const position = rigidBody.translation()
            const rotation = rigidBody.rotation()

            // if (this.keys["w"]) {
            //     rigidBody.applyImpulse(new Three.Vector3(0.5, 0, 0), true)
            // }
            // if (this.keys["s"]) {
            //     rigidBody.applyImpulse(new Three.Vector3(-0.5, 0, 0), true)
            // }
            // if (this.keys["a"]) {
            //     rigidBody.applyImpulse(new Three.Vector3(0, 0, -0.5), true)
            // }
            // if (this.keys["d"]) {
            //     rigidBody.applyImpulse(new Three.Vector3(0, 0, 0.5), true)
            // }
            // if (this.keys[" "]) {
            //     rigidBody.applyImpulse(new Three.Vector3(0, 1, 0), true)
            // }

            mesh.position.set(position.x, position.y, position.z)
            mesh.rotation.set(rotation.x, rotation.y, rotation.z)
        }

        // for (const entity of intersection(
        //     this.getEntities("rigidBody"),
        //     this.getEntities("hover")
        // )) {
        //     const rigidBody = (getComponent(entity, "rigidBody") as RigidBody)
        //         .rigidBody
        //     const targetAltitude = (getComponent(entity, "rigidBody") as Hover)
        //         .altitude
        // }
    }

    fixedStepPlayer = () => {
        // if (
        //     this.playerMovementVector.x !== 0 ||
        //     this.playerMovementVector.y !== 0 ||
        //     this.playerMovementVector.z !== 0
        // ) {
        const entity = Array.from(this.getEntities("player"))[0]
        const characterController = (
            getComponent(entity, "characterController") as CharacterController
        ).characterController
        const rigidBody = (getComponent(entity, "rigidBody") as RigidBody)
            .rigidBody

        const currentPosition = rigidBody.translation()

        const ray = new Rapier.Ray(
            {
                x: currentPosition.x,
                y: currentPosition.y - 0.4,
                z: currentPosition.z
            },
            { x: 0, y: -1, z: 0 }
        )

        const hit = this.physics.castRay(ray, 20, true)

        if (hit !== null) {
            const hitPoint = ray.pointAt(hit.toi)
            const altitude = distance(currentPosition, hitPoint)
            if (altitude > 0.2) {
                this.playerMovementVector.y -= 0.0001
            }
        }

        characterController.computeColliderMovement(
            rigidBody.collider(0),
            this.playerMovementVector
        )

        const correctedMovement = characterController.computedMovement()
        rigidBody.setNextKinematicTranslation(
            new Rapier.Vector3(
                currentPosition.x + correctedMovement.x,
                currentPosition.y + correctedMovement.y,
                currentPosition.z + correctedMovement.z
            )
        )
        // }
    }

    private animate = (time: number) => {
        const delta = time - this.time
        this.time = time

        for (const _i of range(
            0,
            Math.max(Math.floor(delta / (this.physics.timestep * 1000)), 1)
        )) {
            this.fixedStep()
        }

        this.step(delta)

        this.view.render(delta)

        this.animRequestHandle = requestAnimationFrame(this.animate)
    }
}

export interface Transform {
    translation: Vec3
}

export interface Entity {
    id: EntityId
    components: Map<ComponentKind, Component>
    transform: Transform
}

export type EntityId = number

export type ComponentKind =
    | "rigidBody"
    | "mesh"
    | "rigidBodyDesc"
    | "joint"
    | "hover"
    | "characterController"
    | "collider"
    | "player"

export type Component =
    | RigidBodyDesc
    | Mesh
    | RigidBody
    | Joint
    | Hover
    | CharacterController
    | Player

export interface Player {
    kind: "player"
}

export interface RigidBodyDesc {
    kind: "rigidBodyDesc"
    rigidBodyDesc: Rapier.RigidBodyDesc
    colliderDesc: Rapier.ColliderDesc
}
export interface RigidBody {
    kind: "rigidBody"
    rigidBody: Rapier.RigidBody
    collider: Rapier.Collider
}

export interface Collider {
    kind: "collider"
    collider: Rapier.Collider
}
export interface CharacterController {
    kind: "characterController"
    characterController: Rapier.KinematicCharacterController
}

export interface Joint {
    kind: "joint"
    joint: Rapier.ImpulseJoint
}

export interface Mesh {
    kind: "mesh"
    mesh: Three.Mesh
}

/**
 * Component to cause the entity to hover `altitude` units above
 * the nearest surface. Requires `RigidBody` to function.
 */
export interface Hover {
    kind: "hover"
    altitude: number
}

export class Vec2 {
    x: number
    y: number

    constructor(x: number, y: number) {
        this.x = x
        this.y = y
    }
}

export class Vec3 {
    x: number
    y: number
    z: number

    constructor(x: number, y: number, z: number) {
        this.x = x
        this.y = y
        this.z = z
    }
}
