export const $ = (selector: string) =>
    document.body.querySelector(selector) as Element
