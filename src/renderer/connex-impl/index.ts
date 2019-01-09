import { create as createThor } from './thor'
import { create as createVendor } from './vendor'
import { throttle } from './throttle'

// tslint:disable-next-line:no-var-requires
const connexVersion = require('@vechain/connex/package.json').version

export function create(client: Client, concurrent: number): Connex {
    client = throttle(client, concurrent)
    return {
        version: connexVersion,
        thor: createThor(client),
        vendor: createVendor()
    }
}
