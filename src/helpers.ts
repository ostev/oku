export const $ = (selector: string) =>
    document.body.querySelector(selector) as HTMLElement

export function withDefault<T>(value: T | undefined, default_: T): T {
    if (value !== undefined) {
        return value
    } else {
        return default_
    }
}

export const error = (name: string) => {
    return class extends Error {
        name = name

        constructor(message: string | undefined) {
            super(message)
        }
    }
}
