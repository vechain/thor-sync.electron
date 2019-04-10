
import { remakeError } from '@/common/custom-error'


// In case of preload, client page may overwrite global classes, like Promise.
// tslint:disable-next-line:variable-name
const PromiseClass = Promise
// tslint:disable-next-line:variable-name
const ProxyClass = Proxy

export function throttle<T extends object>(obj: T, concurrent: number) {
    return _throttle(obj, {
        concurrent,
        pending: 0,
        waitingList: [],
        checkFlag: false
    })
}

function _throttle<T extends object>(obj: T, ctx: Context): T {
    return new ProxyClass(obj, {
        get: (target, key, receiver) => {
            const prop = Reflect.get(target, key, receiver)
            if (target.hasOwnProperty(key)) {
                if (prop instanceof Object) {
                    return _throttle(prop, ctx)
                }
            }
            return prop
        },
        apply: (target, thisArg, argArray) => {
            const result = Reflect.apply(target as any, thisArg, argArray)
            if (result instanceof PromiseClass) {
                return (async () => {
                    ctx.pending++
                    await new PromiseClass(resolve => {
                        if (ctx.pending > ctx.concurrent) {
                            _checkQueue(ctx)
                            ctx.waitingList.push(resolve)
                        } else {
                            resolve()
                        }
                    })

                    try {
                        return await result
                    } catch (err) {
                        throw remakeError(err)
                    } finally {
                        ctx.pending--
                        const waiting = ctx.waitingList.shift()
                        if (waiting) {
                            waiting()
                        }
                    }
                })()
            }
            if (result instanceof Object) {
                return _throttle(result, ctx)
            }
            return result
        }
    })
}

function _checkQueue(ctx: Context) {
    if (ctx.checkFlag) {
        return
    }
    ctx.checkFlag = true
    setTimeout(() => {
        ctx.checkFlag = false
        if (ctx.pending > ctx.concurrent) {
            // tslint:disable-next-line:no-console
            console.warn(
                `connex: exceeds max concurrent(${ctx.pending}/${ctx.concurrent}). request queued.`)
        }
    }, 0)
}

type Context = {
    readonly concurrent: number
    pending: number
    waitingList: Array<() => void>
    checkFlag: boolean
}
