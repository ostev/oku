import * as Rapier from "@dimforge/rapier3d"
import * as Three from "three"

import { $, error, range, uint32Range, withDefault } from "./helpers"
import { intersection } from "./setHelpers"
import { View } from "./View"
import { vec3Distance, degToRad, easeInOutSine } from "./maths"
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

export type StepFunction = (delta: number, time: number, world: World) => void

export class World {
    private entities: Map<EntityId, Entity> = new Map()
    private componentLookupTable: Map<ComponentKind, Set<EntityId>> = new Map()
    private idCount: EntityId = 0
    // private intervalHandle: number | undefined
    private animRequestHandle: number | undefined
    private time = 0

    private stepFunctions: StepFunction[] = []

    isRunning: boolean = false

    completeGoal: (index: number) => void

    // objectLoader = new Three.ObjectLoader()

    playerMovementVector = new Rapier.Vector3(0, 0, 0)
    /// Player rotation in radians
    playerRotation: number = 0

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

    activateAudioEvent = (event: AudioEvent) => {
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
        }[] = []

        const objects: Three.Object3D[] = []

        gltf.scene.traverse((object) => {
            objects.push(object)

            entityDescriptions.push(
                this.importObject(object, translation, true)
            )
        })

        return entityDescriptions.map(({ transform, components }) =>
            this.addEntity(transform, components)
        )

        // console.log(entityDescriptions)
    }

    importObject = (
        object: Three.Object3D,
        translation: Vec3,
        useShadows: boolean
    ): { transform: Transform; components: Set<Component> } => {
        // console.log(object.name, object.type)
        // console.log(object.name, object)

        const position = object.getWorldPosition(new Three.Vector3())
        const transform: Transform = {
            position: {
                x: position.x,
                y: position.y,
                z: position.z,
            },
            rotation: object.getWorldQuaternion(new Three.Quaternion()),
            scale: object.getWorldScale(new Three.Vector3()),
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

        return { transform, components }

        // console.log(this)
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
            transform,
        }

        const entity: Entity = {
            id,
            components: new Map(),
            transform,
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
        for (const entity of intersection(
            this.getEntities("rigidBody"),
            this.getEntities("mesh")
        )) {
            const rigidBody = (entity.components.get("rigidBody") as RigidBody)
                .rigidBody

            const position = rigidBody.translation()
            const rotation = rigidBody.rotation()

            entity.transform.position = position
            entity.transform.rotation = new Three.Quaternion(
                rotation.x,
                rotation.y,
                rotation.z,
                rotation.w
            )
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

        for (const entity of this.getEntities("audioSource")) {
            const audioSource = getComponent(
                entity,
                "audioSource"
            ) as AudioSource
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

            const hit = this.physics.castRay(ray, 20, false)

            const fallSpeed = 0.0015
            const riseSpeed = 0.0015

            const movementVector = new Vec3(
                this.playerMovementVector.x,
                this.playerMovementVector.y,
                this.playerMovementVector.z
            )

            if (hit !== null) {
                const hitPoint = ray.pointAt(hit.toi)
                const altitude = vec3Distance(currentPosition, hitPoint)
                if (this.debug) {
                    $("#playerPos").textContent = altitude.toFixed(4)
                }
                if (altitude > 1) {
                    movementVector.y -= fallSpeed * delta
                } else if (altitude < 0.29) {
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
}

export type EntityId = number

export type ComponentKind =
    | "rigidBody"
    | "mesh"
    | "rigidBodyDesc"
    | "joint"
    | "characterController"
    | "collider"
    | "player"
    | "audioSource"
    | "listener"

export type Component =
    | RigidBodyDesc
    | Mesh
    | RigidBody
    | Joint
    | CharacterController
    | Player
    | Collider
    | AudioSource
    | Listener

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
    mesh: Three.Object3D
}

export type AudioEvent = SpeakingAudioEvent

export interface SpeakingAudioEvent {
    kind: "speaking"
    text: string
    source: AudioSource
}

export class AudioSource {
    kind: "audioSource" = "audioSource"
    position: Vec3

    constructor(position: Vec3) {
        this.position = position
    }
}

export interface Listener {
    kind: "listener"

    notify: (event: AudioEvent) => void
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
