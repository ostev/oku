export const $ = (selector: string) =>
    document.body.querySelector(selector) as Element

export function withDefault<T>(value: T | undefined, default_: T): T {
    if (value !== undefined) {
        return value
    } else {
        return default_
    }
}
