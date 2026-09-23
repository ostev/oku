import { Dispatch, StateUpdater, useEffect, useState } from "preact/hooks"
import { error } from "../helpers"

const storageCleaner = (key: string, value: unknown) =>
    key == "__proto__" || key == "prototype" || key == "constructor"
        ? undefined
        : value

export const CannotStoreSymbolsError = error("CannotStoreSymbolsError")

/**
 * Uses `localStorage` to persist state. The value must be `JSON.stringify`-able.
 */
export const useStorage = <T>(
    key: string,
    initialValue: T,
): [T, Dispatch<StateUpdater<T>>] => {
    if (typeof initialValue === "symbol") {
        throw new CannotStoreSymbolsError(
            `I cannot serialise and parse a symbol, so I can't store the symbol ${initialValue.toString()}!`,
        )
    }

    const [state, setState] = useState(initialValue)

    useEffect(() => {
        const storedValue = localStorage.getItem(key)

        if (storedValue !== null) {
            const parsedValue = JSON.parse(storedValue, storageCleaner)
            setState(parsedValue)
        }
    }, [])

    const setStorage: Dispatch<StateUpdater<T>> = (value) => {
        setState((prevValue) => {
            const newState =
                typeof value === "function"
                    ? (value as CallableFunction)(prevValue)
                    : value

            const stringifiedValue = JSON.stringify(newState)

            localStorage.setItem(key, stringifiedValue)
            return newState
        })
    }

    return [state, setStorage]
}
