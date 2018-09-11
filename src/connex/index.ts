import { create as createThor } from './thor'

export function create(
    userAddress: string,
    signer: Connex.User['sign'],
    network: Network,
    vendor: Connex.Vendor,
): Connex {
    const thor = createThor(network)
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

