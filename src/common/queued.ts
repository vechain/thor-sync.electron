import Deferred from './deferred'

export default class Queued {
    private _size = 0
    private prev?: Deferred<void>
    constructor(readonly maxSize?: number) {
    }

    public get size() {
        return this._size
    }

    public async enqueue<T>(
        fn: () => Promise<T>
    ): Promise<T> {
        if (this.maxSize && this._size >= this.maxSize) {
            return Promise.reject(new Error('max queued size reached'))
        }
        this._size++

        const cur = new Deferred<void>()
        const prev = this.prev
        this.prev = cur

        if (prev) {
            await prev
        }

        try {
            return await fn()
        } finally {
            this._size--
            cur.resolve()
        }
    }
}
