import { create as createThor } from './thor'

export function create(
    user: Connex.User | undefined,
    site: Connex.Thor.Site,
    vendor: Connex.Vendor,
): Connex {
    const thor = createThor(site)
    return {
        get user() {
            if (user) {
                return { ...user }
            }
        },
        get thor() { return thor },
        get vendor() { return vendor }
    }
}

