import { UserExecutionContext } from "./UserExecutionContext"

export type FnBindings = Record<string, FnBindingInfo>

export interface FnBindingInfo {
    fn: (context: UserExecutionContext, ...args: any[]) => void
}

export type Bindings = Record<string, SyncInfo>

export interface SyncInfo {
    delay:
        | number
        | "parameterSeconds"
        | "untilResume"
        | "untilReturnNumber"
        | "local"
}
