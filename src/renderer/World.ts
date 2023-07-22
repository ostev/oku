import * as Rapier from "@dimforge/rapier3d"
import * as Three from "three"

import { $, error, range, uint32Range, withDefault } from "./helpers"
import { intersection } from "./setHelpers"
import { View } from "./View"
import { vec3Distance, degToRad, easeInOutSine, vec2Distance } from "./maths"
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js"
import { toIndexedGeometry } from "./geometry"

export const MeshComponentNotFoundInThreeJSSceneError = error(
    "MeshComponentNotFoundInThreeJSSceneError"
)

export const ComponentNotFoundError = error("ComponentNotFoundError")

export const CannotCreateConvexHullError = error("CannotCreateConvexHullError")

export const NoIndicesFoundOnGeometryError = error(
    "NoIndicesFoundOnGeometryError"
)

export const getComponent = (
    entity: Readonly<Entity>,
    kind: Readonly<ComponentKind>
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

export const removeComponent = (
    entity: Readonly<Entity>,
    kind: Readonly<ComponentKind>
): boolean => entity.components.delete(kind)

export const forwardVector = (transform: Transform) => {
    const forward = new Three.Vector3(0, 0, -1).applyQuaternion(
        transform.rotation
    )
    return forward
}

export type StepFunction = (delta: number, time: number, world: World) => void

export const ParcelAlreadyHeldError = error("ParcelAlreadyHeldError")
export const NoParcelNearbyError = error("NoParcelNearbyError")
export const NoParcelHeldError = error("NoParcelHeldError")

export class World {
    private entities: Map<EntityId, Entity> = new Map()
    private componentLookupTable: Map<ComponentKind, Set<EntityId>> = new Map()
    private idCount: EntityId = 0
    // private intervalHandle: number | undefined
    private animRequestHandle: number | undefined
    private time = 0

    private stepFunctions: StepFunction[] = []

    isRunning: boolean = false

    code: string | undefined

    completeGoal: (index: number) => void

    // objectLoader = new Three.ObjectLoader()

    playerMovementVector = new Rapier.Vector3(0, 0, 0)
    /// Player rotation in radians
    playerRotation = 0
    playerRaycastHits = true
    heldParcel: Entity | undefined

    view: View
    physics: Rapier.World

    debug = import.meta.env.DEV
    // keys: Record<string, boolean> = {}

    constructor(
        gravity: Readonly<Rapier.Vector3>,
        view: View,
        completeGoal: (index: number) => void
    ) {
        this.physics = new Rapier.World(gravity)
        this.view = view
        this.completeGoal = completeGoal
    }

    pickUpParcel = () => {
        if (this.heldParcel === undefined) {
            const player = Array.from(this.getEntities("player"))[0]
            const playerPos = player.transform.position

            const parcels = this.getEntities("parcel")

            let closest: { distance: number; parcel: Entity } | undefined

            for (const parcel of parcels) {
                const parcelPos = parcel.transform.position

                const verticalDistance = playerPos.y - parcelPos.y

                if (verticalDistance < 0.5 && verticalDistance > -0.5) {
                    const distance = vec2Distance(
                        new Vec2(playerPos.x, playerPos.z),
                        new Vec2(parcelPos.x, parcelPos.z)
                    )
                    if (closest === undefined || distance < closest.distance) {
                        closest = { distance, parcel }
                    }
                }
            }

            if (closest === undefined || closest.distance > 1) {
                throw new NoParcelNearbyError(
                    "There's no parcel within 1 metre for me to pick up!"
                )
            } else {
                this.heldParcel = closest.parcel

                const { rigidBody } = getComponent(
                    this.heldParcel,
                    "rigidBody"
                ) as RigidBody
                // const translation = rigidBody.translation()

                rigidBody.setEnabled(false)

                // const kinematicBodyDesc =
                //     Rapier.RigidBodyDesc.kinematicPositionBased()
                //         .setAdditionalMass(rigidBody.mass())
                //         .setTranslation(
                //             translation.x,
                //             translation.y,
                //             translation.z
                //         )

                // const kinematicBody =
                //     this.physics.createRigidBody(kinematicBodyDesc)
                // const newCollider = this.physics.createCollider(
                //     new Rapier.ColliderDesc(collider.shape),
                //     kinematicBody
                // )

                // removeComponent(this.heldParcel, "rigidBody")
                // this.addComponentToEntity(this.heldParcel, {
                //     kind: "rigidBody",
                //     rigidBody: kinematicBody,
                //     collider: newCollider,
                // })

                // this.physics.removeRigidBody(rigidBody)
            }
        } else {
            throw new ParcelAlreadyHeldError(
                "I'm already holding a parcel, so I can't pick up another one!"
            )
        }
    }

    placeDownParcel = () => {
        if (this.heldParcel !== undefined) {
            const { rigidBody } = getComponent(
                this.heldParcel,
                "rigidBody"
            ) as RigidBody

            const position = this.heldParcel.transform.position
            const forward = forwardVector(this.heldParcel.transform)
            this.heldParcel.transform.position = new Vec3(
                position.x + forward.x / 2,
                position.y + forward.y / 2,
                position.z + forward.z / 2
            )

            rigidBody.setTranslation(this.heldParcel.transform.position, true)
            rigidBody.setRotation(this.heldParcel.transform.rotation, true)

            rigidBody.setEnabled(true)

            // if (oldRigidBodyComponent.rigidBody.isKinematic()) {
            //     const collider = oldRigidBodyComponent.collider
            //     const kinematicBody = oldRigidBodyComponent.rigidBody

            //     const translation = kinematicBody.translation()

            //     const rigidBodyDesc = Rapier.RigidBodyDesc.dynamic()
            //         .setAdditionalMass(kinematicBody.mass())
            //         .setTranslation(translation.x, translation.y, translation.z)

            //     const rigidBody = this.physics.createRigidBody(rigidBodyDesc)
            //     const newCollider = this.physics.createCollider(
            //         new Rapier.ColliderDesc(collider.shape),
            //         rigidBody
            //     )

            //     removeComponent(this.heldParcel, "rigidBody")
            //     this.addComponentToEntity(this.heldParcel, {
            //         kind: "rigidBody",
            //         rigidBody,
            //         collider: newCollider,
            //     })

            //     this.physics.removeRigidBody(kinematicBody)
            // }

            this.heldParcel = undefined
        } else {
            throw new NoParcelHeldError(
                "I'm not currently holding a parcel, so I can't place it down!"
            )
        }
    }

    registerStepFunction = (fn: StepFunction) => {
        this.stepFunctions.push(fn)
    }

    unregisterStepFunction = (fn: StepFunction) => {
        const index = this.stepFunctions.findIndex((x) => x === fn)

        if (index !== -1) {
            this.stepFunctions.splice(index, 1)
        } else {
            console.warn("Cannot unregister step function")
        }
    }

    destroy = () => {
        this.stop()
        this.view.destroy()
        this.entities = null as any
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
        this.isRunning = true
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
        this.isRunning = false
    }

    activateEvent = (event: WorldEventInfo) => {
        const listenerEntities = this.getEntities("listener")

        for (const listenerEntity of listenerEntities) {
            const listener = getComponent(
                listenerEntity,
                "listener"
            ) as Listener

            listener.notify(event)
        }
    }

    // init = () => {
    //     for (const entity of this.getEntities("rigidBody")) {
    //         ;(
    //             getComponent(entity, "rigidBody") as RigidBody
    //         ).rigidBody.setTranslation(entity.transform.translation, true)
    //     }

    //     for (const entity of this.getEntities("mesh")) {
    //         ;(getComponent(entity, "mesh") as Mesh).mesh.position.set(
    //             entity.transform.translation.x,
    //             entity.transform.translation.y,
    //             entity.transform.translation.z
    //         )
    //     }
    // }

    importGLTF = async (url: string, translation: Vec3): Promise<Entity[]> => {
        const gltfLoader = new GLTFLoader()
        const gltf = await gltfLoader.loadAsync(url)

        gltf.scene.position.set(translation.x, translation.y, translation.z)

        // gltf.scene.traverse((object) => {
        //     console.log(object.type)
        // })

        const entityDescriptions: {
            transform: Transform
            components: Set<Component>
            label?: string
        }[] = []

        const objects: Three.Object3D[] = []

        gltf.scene.traverse((object) => {
            objects.push(object)

            entityDescriptions.push(
                this.importObject(object, translation, true)
            )
        })

        return entityDescriptions.map(({ transform, components, label }) =>
            this.addEntity(transform, components, label)
        )
    }

    importObject = (
        object: Three.Object3D,
        translation: Vec3,
        useShadows: boolean
    ): { transform: Transform; components: Set<Component>; label?: string } => {
        const position = object.getWorldPosition(new Three.Vector3())
        const scale = object.getWorldScale(new Three.Vector3())
        const transform: Transform = {
            position: new Vec3(position.x, position.y, position.z),
            rotation: object.getWorldQuaternion(new Three.Quaternion()),
            scale: new Vec3(scale.x, scale.y, scale.z),
        }

        const components = new Set<Component>()

        if (object.type === "Mesh") {
            const mesh = object as Three.Mesh

            mesh.castShadow = useShadows
            mesh.receiveShadow = useShadows

            if (object.name.includes("convex_collider")) {
                // console.log("Convex", object.name)
                const desc = Rapier.ColliderDesc.convexHull(
                    new Float32Array(mesh.geometry.attributes.position.array)
                )
                if (desc === null) {
                    throw new CannotCreateConvexHullError(
                        `Unable to create convex hull for imported mesh of name ${mesh.name}`
                    )
                }
                const collider = this.physics.createCollider(desc)

                collider.setTranslation(transform.position)
                collider.setRotation(transform.rotation)

                components.add({ kind: "collider", collider })
            } else if (object.name.includes("trimesh_collider")) {
                // console.log("trimesh", object.name)
                if (mesh.geometry.index !== null) {
                    const desc = Rapier.ColliderDesc.trimesh(
                        new Float32Array(
                            mesh.geometry.getAttribute("position").array
                        ),
                        // uint32Range(0, vertices.length)
                        new Uint32Array(mesh.geometry.index.array)
                    )

                    const collider = this.physics.createCollider(desc)

                    collider.setTranslation(transform.position)
                    collider.setRotation(transform.rotation)

                    components.add({ kind: "collider", collider })
                } else {
                    throw new NoIndicesFoundOnGeometryError(
                        `The geometry of object ${object.name} doesn't include any indices.`
                    )
                }
            } else {
                // console.log("No collider", object.name)
            }

            components.add({ kind: "mesh", mesh })
        }

        // console.log(transform)
        // console.log(components)
        // console.log(object)

        return {
            transform,
            components,
            label: object.name.trim() !== "" ? object.name : undefined,
        }

        // console.log(this)
    }

    addEntity = (
        transform: Transform,
        components: ReadonlySet<Component>,
        label?: string
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
            transform,
        }

        const entity: Entity = {
            id,
            components: new Map(),
            transform,
            label,
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

    findEntity = (
        predicate: (entity: Readonly<Entity>) => boolean
    ): Entity | undefined => {
        for (const entity of this.entities.values()) {
            if (predicate(entity)) {
                return entity
            }
        }

        return undefined
    }

    addComponentToEntity = (entity: Entity, component: Component) => {
        const finalisedComponent = this.initComponent(entity, component)

        entity.components.set(finalisedComponent.kind, finalisedComponent)

        const ids = this.componentLookupTable.get(finalisedComponent.kind)
        if (ids !== undefined) {
            ids.add(entity.id)
        } else {
            const ids: Set<EntityId> = new Set()
            ids.add(entity.id)
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
                    entity.transform.position.x,
                    entity.transform.position.y,
                    entity.transform.position.z
                ),
                false
            )

            return { kind: "rigidBody", rigidBody, collider }
        } else if (component.kind === "mesh") {
            component.mesh.position.set(
                entity.transform.position.x,
                entity.transform.position.y,
                entity.transform.position.z
            )

            // component.mesh.name = entity.id.toString()
            this.view.scene.add(component.mesh)

            return component
        } else {
            return component
        }
    }

    getEntities = (componentKind: Readonly<ComponentKind>): Set<Entity> => {
        const entities = new Set<Entity>()
        const entityIds = this.componentLookupTable.get(componentKind)

        if (entityIds !== undefined) {
            for (const entityId of entityIds) {
                entities.add(this.entities.get(entityId) as Entity)
            }
        }

        return entities
    }

    fixedStep = (delta: number) => {
        this.fixedStepPlayer(delta)
        this.physics.step()
    }

    step = (delta: number) => {
        for (const entity of this.getEntities("rigidBody")) {
            const rigidBody = (entity.components.get("rigidBody") as RigidBody)
                .rigidBody

            if (rigidBody.isEnabled()) {
                const position = rigidBody.translation()
                const rotation = rigidBody.rotation()

                entity.transform.position = Vec3.fromXYZ(position)
                entity.transform.rotation = new Three.Quaternion(
                    rotation.x,
                    rotation.y,
                    rotation.z,
                    rotation.w
                )
            }
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

        for (const entity of this.getEntities("mesh")) {
            const mesh = (entity.components.get("mesh") as Mesh).mesh

            mesh.position.set(
                entity.transform.position.x,
                entity.transform.position.y,
                entity.transform.position.z
            )
            mesh.rotation.setFromQuaternion(entity.transform.rotation)
            mesh.scale.set(
                entity.transform.scale.x,
                entity.transform.scale.y,
                entity.transform.scale.z
            )
        }

        for (const entity of this.getEntities("eventSource")) {
            const audioSource = getComponent(
                entity,
                "eventSource"
            ) as EventSource
            audioSource.position = entity.transform.position
        }

        for (const fn of this.stepFunctions) {
            fn(delta, this.time, this)
        }
    }

    fixedStepPlayer = (delta: number) => {
        // if (
        //     this.playerMovementVector.x !== 0 ||
        //     this.playerMovementVector.y !== 0 ||
        //     this.playerMovementVector.z !== 0
        // ) {
        const entity = Array.from(this.getEntities("player"))[0]

        if (entity !== undefined) {
            const characterController = (
                getComponent(
                    entity,
                    "characterController"
                ) as CharacterController
            ).characterController
            const rigidBody = (getComponent(entity, "rigidBody") as RigidBody)
                .rigidBody

            const currentPosition = rigidBody.translation()

            const ray = new Rapier.Ray(
                {
                    x: currentPosition.x,
                    y: currentPosition.y - 0.21,
                    z: currentPosition.z,
                },
                { x: 0, y: -1, z: 0 }
            )

            const hit = this.physics.castRay(ray, 20, true)

            const fallSpeed = 0.0015
            const riseSpeed = 0.0015

            const movementVector = new Vec3(
                this.playerMovementVector.x,
                this.playerMovementVector.y,
                this.playerMovementVector.z
            )

            if (hit !== null) {
                this.playerRaycastHits = true

                // const hitPoint = ray.pointAt(hit.toi)
                // const altitude = vec3Distance(currentPosition, hitPoint)
                const altitude = hit.toi
                if (this.debug) {
                    $("#playerPos").textContent = altitude.toFixed(4)
                }
                if (altitude > 0.3) {
                    movementVector.y -= fallSpeed * delta
                } else if (altitude < 0.05) {
                    movementVector.y += riseSpeed * delta
                } else {
                    const animationDuration = 5_000
                    let isEvenCycle =
                        Math.floor(this.time / animationDuration) % 2 == 0
                    const absoluteAnimationProgress =
                        ((this.time % animationDuration) / animationDuration) *
                            2 -
                        1
                    const animationProgress = isEvenCycle
                        ? -absoluteAnimationProgress
                        : absoluteAnimationProgress
                    movementVector.y +=
                        (easeInOutSine(animationProgress) * 2 - 1) * 0.001
                }
            } else {
                movementVector.y -= fallSpeed * delta
                this.playerRaycastHits = false

                if (this.debug) {
                    $("#playerPos").textContent = "No hit"
                }
            }

            characterController.computeColliderMovement(
                rigidBody.collider(0),
                movementVector
            )

            const correctedMovement = characterController.computedMovement()
            rigidBody.setNextKinematicTranslation(
                new Rapier.Vector3(
                    currentPosition.x + correctedMovement.x,
                    currentPosition.y + correctedMovement.y,
                    currentPosition.z + correctedMovement.z
                )
            )

            const rotation = new Three.Quaternion().setFromEuler(
                new Three.Euler(0, this.playerRotation, 0, "YXZ")
            )
            // rotation.setFromAxisAngle(
            //     new Three.Vector3(0, 1, 0),
            //     this.playerRotation
            // )
            rigidBody.setNextKinematicRotation(rotation)
        }
        if (this.heldParcel !== undefined) {
            const position = entity.transform.position

            // const forward = forwardVector(entity.transform)
            this.heldParcel.transform.position = new Vec3(
                position.x,
                position.y + 1.5,
                position.z
            )
        }
    }

    private animate = (time: number) => {
        const delta = time - this.time
        this.time = time

        if (delta < 100) {
            if (this.debug) {
                $("#fps").textContent = Math.round(1000 / delta).toString()
            }

            // for (const _i of range(
            //     0,
            //     Math.max(Math.floor(delta / (this.physics.timestep * 1000)), 1)
            // )) {
            this.fixedStep(delta)
            // }

            this.step(delta)

            this.view.render(delta)
        } else {
            console.warn(
                `Excessive frame time of ${delta.toFixed(0)}ms. Skipping frame.`
            )
        }

        this.animRequestHandle = requestAnimationFrame(this.animate)
    }
}

export interface Transform {
    position: Vec3
    rotation: Three.Quaternion
    scale: Vec3
}

export const translation = (translation: Vec3): Transform => ({
    position: translation,
    rotation: new Three.Quaternion(),
    scale: new Vec3(1, 1, 1),
})

export interface Entity {
    id: EntityId
    components: Map<ComponentKind, Component>
    transform: Transform
    label?: string
}

export type EntityId = number

export type ComponentKind =
    | "rigidBody"
    // | "disabledRigidBody"
    | "mesh"
    | "rigidBodyDesc"
    | "joint"
    | "characterController"
    | "collider"
    | "player"
    | "eventSource"
    | "listener"
    | "parcel"

export type Component =
    | RigidBodyDesc
    | Mesh
    | RigidBody
    // | DisabledRigidBody
    | Joint
    | CharacterController
    | Player
    | Collider
    | EventSource
    | Listener
    | Parcel

export interface Parcel {
    kind: "parcel"
}

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

// export interface DisabledRigidBody {
//     kind: "disabledRigidBody"
//     rigidBody: RigidBody
// }

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
    mesh: Three.Object3D
}

export interface WorldEventInfo {
    event: WorldEvent
    source: EventSource
}

export type WorldEvent =
    | AudioEvent
    | MovementEvent
    | WaitEvent
    | RepeatEvent
    | ExecutionCompleteEvent

export interface RepeatEvent {
    kind: "repeat"
    times: number
}

export interface ExecutionCompleteEvent {
    kind: "executionComplete"
}

export interface WaitEvent {
    kind: "wait"
    duration: number
}

export type MovementEvent = ForwardMovementEvent | TurnMovementEvent

export interface ForwardMovementEvent {
    kind: "forward"
    distance: number
}

export interface TurnMovementEvent {
    kind: "turn"
    radians: number
}

export type AudioEvent = SpeakingAudioEvent

export interface SpeakingAudioEvent {
    kind: "speaking"
    text: string
}

export class EventSource {
    kind: "eventSource" = "eventSource"
    position: Vec3

    constructor(position: Vec3) {
        this.position = position
    }
}

export interface Listener {
    kind: "listener"

    notify: (event: WorldEventInfo) => void
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

    static zero = new Vec3(0, 0, 0)

    constructor(x: number, y: number, z: number) {
        this.x = x
        this.y = y
        this.z = z
    }

    static fromXYZ = ({ x, y, z }: { x: number; y: number; z: number }) =>
        new Vec3(x, y, z)

    scale = (other: Vec3) =>
        new Vec3(this.x * other.x, this.y * other.y, this.z * other.z)

    add = (other: Vec3) =>
        new Vec3(this.x + other.x, this.y + other.y, this.z + other.z)

    prettyPrint = () => `${this.x}, ${this.y}, ${this.z}`
}

export const forward = (
    distance: number,
    world: World,
    entity: Entity,
    onComplete: () => void
) => {
    const startingPlayerPos = entity.transform.position
    const speed = 0.001

    const stepFunction = (delta: number, time: number, world: World) => {
        const player = world.getEntity(entity.id)
        if (player !== undefined) {
            if (
                vec3Distance(startingPlayerPos, player.transform.position) >
                distance
            ) {
                world.playerMovementVector = new Three.Vector3(0, 0, 0)
                world.unregisterStepFunction(stepFunction)

                onComplete()
            } else {
                // world.playerMovementVector.z =
                //     -speed * delta
                const forward = forwardVector(player.transform)

                world.playerMovementVector = forward.multiplyScalar(
                    speed * delta
                )

                // $(
                //     "#other"
                // ).textContent = `${world.playerMovementVector.x}, ${world.playerMovementVector.y}, ${world.playerMovementVector.z}`
            }
        }
    }
    world.registerStepFunction(stepFunction)
}

export const turn = (
    degrees: number,
    startingRadianRotation: number,
    world: World,
    entity: Entity,
    setRotation: (radians: number) => void,
    onComplete: () => void
) => {
    const radians = -degToRad(degrees)

    const originalRotation = startingRadianRotation

    const speed = 0.005
    const startTime = performance.now()
    const duration = Math.abs(radians) / speed

    const stepFunction = (delta: number, time: number, world: World) => {
        let linearProgress = (time - startTime) / duration
        if (linearProgress > 1) {
            linearProgress = 1
        }
        const progress = easeInOutSine(linearProgress)

        world.playerRotation = originalRotation + radians * progress

        if (world.debug) {
            $("#other").textContent = `Turn progress: ${progress}`
        }

        if (linearProgress === 1) {
            world.unregisterStepFunction(stepFunction)
            onComplete()

            if (world.debug) {
                $("#other").textContent = ""
            }
        }
    }
    world.registerStepFunction(stepFunction)
}
