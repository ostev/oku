import { FunctionalComponent } from "preact"

export const Modal: FunctionalComponent<{
    name: string
    title: string
    onDismiss: () => void
}> = ({ name, title, onDismiss, children }) => {
    const idName = name.replace(" ", "_")
    return (
        <div
            class="fixed right-20 top-20 z-[1055]  overflow-y-auto overflow-x-hidden outline-none"
            id={idName}
            tabIndex={-1}
            aria-labelledby={`${idName}_label`}
        >
            <div
                data-te-modal-dialog-ref
                class="pointer-events-none relative w-auto transition-all duration-300 ease-in-out min-[576px]:mx-auto min-[576px]:mt-7 min-[576px]:max-w-[500px]"
            >
                <div class="min-[576px]:shadow-[0_0.5rem_1rem_rgba(#000, 0.15)] pointer-events-auto relative flex w-full flex-col rounded-md border-none bg-white bg-clip-padding text-current shadow-lg outline-none dark:bg-neutral-600">
                    <div class="flex flex-shrink-0 items-center justify-between rounded-t-md border-b-2 border-neutral-100 border-opacity-100 p-4 dark:border-opacity-50">
                        <h5
                            class="text-xl font-medium leading-normal text-neutral-800 dark:text-neutral-200"
                            id={`${idName}_label`}
                        >
                            {title}
                        </h5>
                        {/* <button
                            type="button"
                            class="box-content rounded-none border-none hover:no-underline hover:opacity-75 focus:opacity-100"
                            aria-label="Close"
                            onClick={() => {
                                console.log("Close")
                                onDismiss()
                            }}
                        >
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke-width="1.5"
                                stroke="currentColor"
                                class="h-6 w-6"
                            >
                                <path
                                    stroke-linecap="round"
                                    stroke-linejoin="round"
                                    d="M6 18L18 6M6 6l12 12"
                                />
                            </svg>
                        </button> */}
                    </div>

                    <div class="relative flex-auto p-4">{children}</div>

                    <div class="flex flex-shrink-0 flex-wrap items-center justify-end rounded-b-md border-t-2 border-neutral-100 border-opacity-100 p-4 dark:border-opacity-50">
                        <button
                            type="button"
                            class="inline-block rounded  hover:bg-slate-200 px-6 pb-2 pt-2.5 text-xs font-medium uppercase leading-normal text-primary-700 transition duration-150 ease-in-out hover:bg-primary-accent-100 focus:bg-primary-accent-100 focus:outline-none focus:ring-0 active:bg-primary-accent-200"
                            onClick={onDismiss}
                        >
                            Close
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}
