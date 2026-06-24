export function intersection<T>(
    setA: ReadonlySet<T>,
    setB: ReadonlySet<T>
): Set<T> {
    const _intersection = new Set<T>()
    for (const elem of setB) {
        if (setA.has(elem)) {
            _intersection.add(elem)
        }
    }
    return _intersection
}
