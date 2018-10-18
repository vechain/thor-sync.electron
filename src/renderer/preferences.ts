import LocalDB from './local-db'

class Preferences extends LocalDB<any> {
    constructor() {
        super('sync', 'preferences')
    }
}

namespace Preferences {
    export const KEY_NETWORKS = 'networks'
    export const KEY_SHORTCUTS = 'shortcuts'
    export const KEY_IS_AUTO_UPDATE = 'is_auto_update'
}

export default Preferences
