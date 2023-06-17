export interface Level<Model> {
    update: (time: number, player: Player) => Model
    view: (model: Model) => LevelNode[]
}

export type LevelNode = Container | Block

export interface Container {
    kind: "container"
    children: LevelNode[]
}

export interface Block {
    kind: "block"
    dimensions: Dimensions
}

export class Dimensions {
    width: number
    height: number

    constructor(width: number, height: number) {
        this.width = width
        this.height = height
    }
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

export interface Player {
    position: Vec3
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
