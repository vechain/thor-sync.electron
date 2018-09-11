import { create as createThor } from './thor'

export function create(
    userAddress: string,
    signer: Connex.User['sign'],
    wire: WireInterface,
    network: NetworkInterface,
    vendor: Connex.Vendor
): Connex {
    const thor = createThor(wire, network)
    const user = {
        get address() { return userAddress },
        get sign() {
            return signer
        }
    }
    return {
        get user() { return user },
        get thor() { return thor },
        get vendor() { return vendor }
    }
}

export { Network } from './network'
export { Wire } from './wire'
