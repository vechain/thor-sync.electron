import { create as createThor } from './thor'
import { create as createVendor } from './vendor'
import { WebContents } from 'electron'

// tslint:disable-next-line:no-var-requires
const connexVersion = require('@vechain/connex/package.json').version

export function create(contents: WebContents, node: Thor.Node, cache: Thor.Cache): Connex {
    return {
        version: connexVersion,
        thor: createThor(node, cache),
        vendor: createVendor(contents)
    }
}
