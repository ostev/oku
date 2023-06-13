import * as Rapier from "@dimforge/rapier3d"
import * as Three from "three"

import { withDefault } from "./helpers"
import { View } from "./View"

export class World {
    private physics: Rapier.World
    private entities: Map<EntityId, Entity> = new Map()
    private componentLookupTable: Map<ComponentKind, Set<EntityId>> = new Map()
    private idCount: EntityId = 0

    view: View

    constructor(gravity: Rapier.Vector3, view: View) {
        this.physics = new Rapier.World(gravity)
        this.view = view
    }

    addEntity = (components: Set<Component>): Readonly<Entity> => {
        this.idCount += 1

        const id = this.idCount
        const entity = { id, components }

        this.entities.set(id, entity)

        for (const component of components) {
            this.initComponent(entity, component)

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

    getEntity = (id: EntityId): Readonly<Entity> | undefined => {
        return this.entities.get(id)
    }

    addComponentToEntity = (id: EntityId, component: Component) => {
        const entity = this.entities.get(id) as Entity
        entity.components.add(component)

        this.initComponent(entity, component)

        const ids = this.componentLookupTable.get(component.kind)
        if (ids !== undefined) {
            ids.add(id)
        } else {
            const ids: Set<EntityId> = new Set()
            ids.add(id)
            this.componentLookupTable.set(component.kind, ids)
        }

        this.initComponent(entity, component)
    }

    private initComponent = (_entity: Entity, component: Component) => {
        if (component.kind === "rigidBody") {
            this.physics.createRigidBody(component.descriptor)
        } else if (component.kind === "mesh") {
            this.view.scene.add(component.mesh)
        }
    }

    getEntities = (
        componentKind: ComponentKind
    ): ReadonlySet<Readonly<Entity>> => {
        const entities = new Set<Readonly<Entity>>()
        for (const entityId of withDefault(
            this.componentLookupTable.get(componentKind),
            new Set()
        )) {
            entities.add(this.entities.get(entityId) as Entity)
        }

        return entities
    }

    fixedStep = () => {
        this.physics.step()
    }

    step = () => {}
}

export interface Entity {
    id: EntityId
    components: Set<Component>
}
export type EntityId = number

export type ComponentKind = "rigidBody" | "mesh"
export type Component = RigidBody | Mesh

export interface RigidBody {
    kind: "rigidBody"
    descriptor: Rapier.RigidBodyDesc
}

export interface Mesh {
    kind: "mesh"
    mesh: Three.Mesh
}
