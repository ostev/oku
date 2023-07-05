import { StateUpdater, useEffect, useState } from "preact/hooks"
import { error } from "../helpers"

const storageCleaner = (key: string, value: unknown) =>
    key.includes("proto") ? undefined : value

export const CannotStoreSymbolsError = error("CannotStoreSymbolsError")

/**
 * Uses `localStorage` to persist state. The value must be `JSON.stringify`-able.
 */
export const useStorage = <T>(
    key: string,
    initialValue: T
): [T, (value: T) => void] => {
    if (typeof initialValue === "symbol") {
        throw new CannotStoreSymbolsError(
            `I cannot serialise and parse a symbol, so I can't store the symbol ${initialValue.toString()}!`
        )
    }

    const [state, setState] = useState(initialValue)

    useEffect(() => {
        const storedValue = localStorage.getItem(key)

        if (storedValue !== null) {
            const parsedValue =
                // typeof state === "string"
                //     ? storedValue
                //     : typeof state === "number"
                //     ? Number(storedValue)
                //     : typeof state === "bigint"
                //     ? BigInt(storedValue)
                JSON.parse(storedValue, storageCleaner)
            setState(parsedValue)
        }

        // setHasLoaded(true)
    }, [])

    const setStorage: (value: T) => void = (value) => {
        setState(value)

        const stringifiedValue =
            // typeof value === "string" ||
            // typeof value === "number" ||
            // typeof value === "bigint"
            //     ? value.toString()
            JSON.stringify(value)

        localStorage.setItem(key, stringifiedValue)
    }

    return [state, setStorage]
}
