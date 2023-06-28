export type FnBindings = Record<string, FnBindingInfo>

export interface FnBindingInfo {
    fn: CallableFunction
}

export type Bindings = Record<string, SyncInfo>

export interface SyncInfo {
    delay: number | "parameterSeconds"
}

export const bindingSyncInfo: Bindings = {
    say: { delay: 0 },
    wait: { delay: "parameterSeconds" }
}

// export const stripFn = (fnBindings: FnBindings): Bindings => {
//     const bindings: Bindings = {}
//     for (const [name, { sync }] of Object.entries(fnBindings)) {
//         bindings[name] = sync
//     }

//     return bindings
// }
