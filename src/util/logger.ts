/* eslint-disable no-console */
export type LoggerType = ReturnType<typeof getLogger>

export function getLogger(prefix: string, verbose: boolean) {
    return function (message: unknown, lowPriority = false) {
        if (lowPriority && !verbose) return
        console.log(`[${prefix}]`, message)
    }
}
