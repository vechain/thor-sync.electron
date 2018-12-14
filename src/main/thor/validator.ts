
export class BadParameter extends Error {
    constructor(msg: string) {
        super(msg)
        this.name = BadParameter.name
    }
}

function ensure(b: boolean, msg: string) {
    if (!b) {
        throw new BadParameter(msg)
    }
}

export function blockNumber(val: number, msg: string) {
    ensure(val >= 0 && val < 2 ** 32 && Number.isInteger(val), msg)
}

export function bytes32(val: string, msg: string) {
    ensure(/^0x[0-9a-f]{64}$/i.test(val), msg)
}

export function address(val: string, msg: string) {
    ensure(/^0x[0-9a-f]{40}$/i.test(val), msg)
}

export function gas(val: number, msg: string) {
    ensure(val >= 0 && val < 2 ** 64 && Number.isSafeInteger(val), msg)
}
