import { create as createThor } from './thor'
import { create as createVendor } from './vendor'

// tslint:disable-next-line:no-var-requires
const connexVersion = require('@vechain/connex/package.json').version

export function create(client: Client): Connex {
    return {
        version: connexVersion,
        thor: createThor(client),
        vendor: createVendor()
    }
}
