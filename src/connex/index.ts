import { create as createThor } from './thor'

export function create(
    site: Connex.Thor.Site,
    vendor: Connex.Vendor,
): Connex {
    const thor = createThor(site)
    return {
        get thor() { return thor },
        get vendor() { return vendor }
    }
}

