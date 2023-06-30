export const $ = (selector: string) =>
    document.body.querySelector(selector) as HTMLElement

export function withDefault<T>(value: T | undefined, default_: T): T {
    if (value !== undefined) {
        return value
    } else {
        return default_
    }
}

export const range = (start: number, end: number): number[] =>
    [...Array(end).keys()].map((i) => i + start)

export const uint32Range = (start: number, end: number): Uint32Array => {
    const array = new Uint32Array(end)

    for (let i = 0; i < end; i++) {
        array[i] = start + i
    }

    return array
}

export const error = (name: string) => {
    return class extends Error {
        name = name

        constructor(message: string | undefined) {
            super(message)
        }
    }
}

export const NotYetImplementedError = error("NotYetImplementedError")

export const RefAccessedBeforeComponentMountedError = error(
    "RefAccessedBeforeComponentMountedError"
)
