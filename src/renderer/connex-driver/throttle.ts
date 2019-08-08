
export class Throttle {

    private _n = 0
    private readonly queue = [] as Array<() => void>

    constructor(readonly softLimit: number, readonly hardLimit: number) {
    }

    get concurrent() { return this._n }

    public async throttle<T>(fn: () => Promise<T>): Promise<T> {
        if (this._n >= this.hardLimit) {
            throw new ThrottleError(`request throttled (concurrent hard limit ${this.hardLimit})`)
        }

        this._n++
        if (this._n > this.softLimit) {
            return new Promise<T>((resolve, reject) => {
                this.queue.push(async () => {
                    try {
                        resolve(await fn())
                    } catch (err) {
                        reject(err)
                    } finally {
                        this._n--
                        this.next()
                    }
                })
            })
        } else {
            try {
                return await fn()
            } finally {
                this._n--
                this.next()
            }
        }
    }

    private next() {
        const pending = this.queue.shift()
        if (pending) {
            pending()
        }
    }
}

export class ThrottleError extends Error {
    constructor(msg: string) {
        super(msg)
    }
}

ThrottleError.prototype.name = 'ThrottleError'
