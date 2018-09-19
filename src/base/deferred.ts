
class Deferred<T> extends Promise<T> {
    constructor() {
        if (arguments.length > 0) {
            // fallback to Promise constructor
            super(arguments[0])
            this.resolve = () => { throw new Error('Deferred.resolve is not callable') }
            this.reject = () => { throw new Error('Deferred.reject is not callable') }
            return
        }

        let _resolve: any
        let _reject: any
        super((resolve, reject) => {
            _resolve = resolve
            _reject = reject
        })

        this.resolve = _resolve
        this.reject = _reject
    }
}

interface Deferred<T> {
    resolve(v?: T | PromiseLike<T>): void
    reject(reason?: any): void
}


let _lazyCallingThen = false

export class Lazy<T> extends Promise<T> {
    constructor(
        executor: (
            resolve: (value?: T | PromiseLike<T>) => void,
            reject: (reason?: any) => void) => void
    ) {
        if (_lazyCallingThen) {
            // fallback to Promise constructor
            super(executor)
            return
        }

        let delayed: () => void
        super((resolve, reject) => {
            delayed = () => {
                if (executor) {
                    try {
                        executor(resolve, reject)
                    } finally {
                        executor = undefined as any
                    }
                }
            }
        })

        const _then = super.then
        this.then = function() {
            setImmediate(delayed)
            try {
                _lazyCallingThen = true
                return _then.apply(this, arguments)
            } finally {
                _lazyCallingThen = false
            }
        }

        const _catch = super.catch
        this.catch = function() {
            setImmediate(delayed)
            try {
                _lazyCallingThen = true
                return _catch.apply(this, arguments)
            } finally {
                _lazyCallingThen = false
            }
        }
    }
}

export default Deferred
