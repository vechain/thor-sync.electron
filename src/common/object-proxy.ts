import { remote } from 'electron'
import Deferred from './deferred'

const isMainProcess = !remote
export function proxyObject<T extends object>(obj: T, fromMainProcess: boolean, signal: { disconnected: boolean }): T {
    return new Proxy(obj, {
        get: (target, key, receiver) => {
            const prop = Reflect.get(target, key, receiver)
            if (target.hasOwnProperty(key)) {
                if (prop instanceof Object) {
                    return proxyObject(prop, fromMainProcess, signal)
                }
            }
            return prop
        },
        apply: (target, thisArg, argArray) => {
            try {
                const result = Reflect.apply(target as any, thisArg, argArray)
                if (result instanceof Promise) {
                    return proxyPromise(result, fromMainProcess, signal)
                }
                if (result instanceof Object) {
                    return proxyObject(result, fromMainProcess, signal)
                }
                return result
            } catch (err) {
                if (fromMainProcess) {
                    if (isMainProcess) {
                        // err will be thrown from main process to render process
                        throw new Error(JSON.stringify({ name: err.name, message: err.message }))
                    } else {
                        // err thrown from main process to render process
                        const msg = err.message as string
                        const token = 'Underlying error: '
                        const line = msg.split('\n')[0] || ''
                        const index = line.indexOf(token)
                        if (index >= 0) {
                            const errObj = JSON.parse(line.slice(index + token.length))
                            throw newError(errObj.name, errObj.message)
                        } else {
                            throw err
                        }
                    }
                }
                throw err
            }
        }
    })
}

function proxyPromise<T>(p: Promise<T>, fromMainProcess: boolean, signal: { disconnected: boolean }) {
    const deferred = new Deferred<T>()

    p.then(r => {
        if (!signal.disconnected) {
            deferred.resolve(r)
        }
    }).catch(err => {
        if (!signal.disconnected) {
            if (fromMainProcess) {
                if (!isMainProcess) {
                    err = newError(err.name, err.message)
                }
            } else {
                if (isMainProcess) {
                    err = newError(err.name, err.message)
                } else {
                    err = { name: err.name, message: err.message }
                }
            }
            deferred.reject(err)
        }
    })
    return deferred
}


const errorClasses: { [name: string]: { new(msg: string): Error } } = {}

function newError(name: string, msg: string) {
    let cls = errorClasses[name]
    if (!cls) {
        // tslint:disable-next-line:no-eval
        cls = eval(`()=> class ${name} extends global.Error {
            constructor(message) {
                super(message)
                this.name = '${name}'
            }
        }`)()
        errorClasses[name] = cls
    }
    const err = new cls(msg)
    err.stack = '' // remove stack info
    return err
}
