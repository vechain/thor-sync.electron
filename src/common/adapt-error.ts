import { remote } from 'electron'

const isMainProcess = !remote
export function adaptError<T extends object>(obj: T, fromMainProcess: boolean): T {
    return new Proxy(obj, {
        get: (target, key, receiver) => {
            const prop = Reflect.get(target, key, receiver)
            if (target.hasOwnProperty(key)) {
                if (prop instanceof Object) {
                    return adaptError(prop, fromMainProcess)
                }
            }
            return prop
        },
        apply: (target, thisArg, argArray) => {
            try {
                const result = Reflect.apply(target as any, thisArg, argArray)
                if (result instanceof Promise) {
                    return adaptPromiseError(result, fromMainProcess)
                }
                if (result instanceof Object) {
                    return adaptError(result, fromMainProcess)
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

async function adaptPromiseError<T>(p: Promise<T>, fromMainProcess: boolean) {
    try {
        return await p
        // assumed to be pure data

        // if (resolved instanceof Object) {
        //     return adaptError(resolved as any, fromMainProcess)
        // }
        // return resolved
    } catch (err) {
        if (fromMainProcess) {
            if (!isMainProcess) {
                throw newError(err.name, err.message)
            }
        } else {
            if (isMainProcess) {
                throw newError(err.name, err.message)
            } else {
                throw { name: err.name, message: err.message }
            }
        }
        throw err
    }
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
