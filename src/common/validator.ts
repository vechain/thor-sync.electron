

export function isDecString(val: string) {
    return typeof val === 'string' && /^[0-9]+$/.test(val)
}

export function isHexString(val: string) {
    return /^0x[0-9a-f]+$/i.test(val)
}

export function isHexBytes(val: string) {
    return /^0x[0-9a-f]*$/i.test(val) && val.length % 2 === 0
}

export function isAddress(val: string) {
    return /^0x[0-9a-f]{40}$/i.test(val)
}

export function isBytes32(val: string) {
    return /^0x[0-9a-f]{64}$/i.test(val)
}

export function isUint32(val: number) {
    return val >= 0 && val < 2 ** 32 && Number.isInteger(val)
}
