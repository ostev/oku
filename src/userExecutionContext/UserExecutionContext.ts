import { error } from "../helpers"
import { FnBindings } from "./bindings"
import userExecutionContextIFrameScriptUrl from "./userExecutionContextIFrame?url"

export class UserExecutionContext {
    private iframe: HTMLIFrameElement | undefined
    bindings: FnBindings

    constructor(parent: Element, bindings: FnBindings) {
        this.bindings = bindings
        this.initialiseIFrame(parent)
    }

    initialiseIFrame = (parent: Element) => {
        this.iframe = document.createElement("iframe")

        parent.appendChild(this.iframe)

        this.iframe.setAttribute("sandbox", "allow-scripts")
        this.iframe.setAttribute("style", "display: none;")

        this.iframe.contentWindow?.document.open()

        const script = this.iframe.contentWindow?.document.createElement(
            "script"
        ) as HTMLScriptElement
        if (import.meta.env.DEV) {
            script.setAttribute("type", "module")
        }
        script.setAttribute("src", userExecutionContextIFrameScriptUrl)
        this.iframe.contentWindow?.document.appendChild(script)

        this.iframe.contentWindow?.document.close()

        window.addEventListener("message", (e) => {
            // Check that we received an array and that the program finished
            if (typeof e.data === "object" && e.data[0] === "result") {
                console.log("Code finished running.")
            } else if (typeof e.data === "object" && e.data[0] === "error") {
                console.error("Your code has an error! 😲 Here it is:")
                console.error(e.data[1])
            } else if (
                typeof e.data === "object" &&
                typeof e.data[0] === "string" &&
                !e.data[0].includes("proto") &&
                this.bindings.hasOwnProperty(e.data[0])
            ) {
                const name = e.data[0] as string
                const args = (e.data as any[]).slice(1)
                const bindingInfo = this.bindings[name]
                bindingInfo.fn(...args)
            } else {
                throw new InvalidMessageReceivedFromUserExecutionContextError(
                    "The user execution context iframe posted an invalid response to the host application."
                )
            }
        })

        // ;(this.iframe as HTMLIFrameElement).contentWindow?.postMessage([""], "*")
    }

    evalAsync = async (code: string) => {
        ;(this.iframe as HTMLIFrameElement).contentWindow?.postMessage(
            ["eval", code],
            "*"
        )
    }
}

export const InvalidMessageReceivedFromUserExecutionContextError = error(
    "InvalidMessageReceivedFromExecutionContext"
)
