
export class BadParameter extends Error {
    constructor(msg: string) {
        super(msg)
        this.name = BadParameter.name
    }
}

export function ensure(b: boolean, msg: string) {
    if (!b) {
        throw new BadParameter(msg)
    }
}
