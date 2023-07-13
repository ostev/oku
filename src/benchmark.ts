export const benchmark = <T>(f: () => T): { duration: number; value: T } => {
    const startTime = performance.now()

    const value = f()

    const endTime = performance.now()
    return { duration: endTime - startTime, value }
}
