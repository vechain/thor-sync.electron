import { create as createThor } from './thor'

export function create(
    userAddress: string,
    signer: Connex.User['sign'],
    wire: WireInterface,
    network: NetworkInterface
): Connex {
    const thor = createThor(wire, network)
    const user = {
        get address() { return userAddress },
        get sign() {
            return signer
        }
    }
    const toolkit = {}
    return {
        get user() { return user },
        get thor() { return thor },
        get toolkit() { return toolkit }
    }
}

export { Network } from './network'
export { Wire } from './wire'
