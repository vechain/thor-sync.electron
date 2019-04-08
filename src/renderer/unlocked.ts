

const map = new Map<number, Unlocked>()

class Unlocked {
    private timer: any

    constructor(readonly id: number, readonly privateKey: Buffer, readonly timeout: number) {
        this.timer = setTimeout(() => this.expire(), timeout)
    }

    public renew() {
        clearTimeout(this.timer)
        this.timer = setTimeout(() => this.expire(), this.timeout)
    }
    private expire() {
        map.delete(this.id)
    }
}


export function setUnlocked(id: number, privateKey: Buffer) {
    const unlocked = map.get(id)
    if (unlocked) {
        unlocked.renew()
    } else {
        map.set(id, new Unlocked(id, privateKey, 5 * 60 * 1000))
    }
}

export function getUnlocked(id: number) {
    const unlocked = map.get(id)
    return unlocked ? unlocked.privateKey : null
}
