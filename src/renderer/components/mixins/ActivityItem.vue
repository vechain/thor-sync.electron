<script lang="ts">
import { Vue, Component, Prop, Emit } from 'vue-property-decorator'
import * as TimeAgo from 'timeago.js'
import { State } from 'vuex-class'

@Component
export default class ActivityItemMixin extends Vue {
    @Prop(Object)
    item !: entities.Activity<'tx' | 'cert'>
    signer !:string

    timeAgo = TimeAgo.format

    get time() {
        this.$store.state.syncStatus // pulse
        return this.timeAgo(this.item.createdTime)
    }

    get wallet() {
        const wallets = this.$store.state.wallets as entities.Wallet[]
        let temp: any = wallets.find(w => w.address === this.signer)
        if (!temp) {
            let ledger = this.$store.getters.ledgerAccounts.find((item: any) => {
                return item.accounts.indexOf(this.signer) >= 0
            })

            if (ledger) {
                let index = ledger.accounts.indexOf(this.signer.toLowerCase())
                temp = {
                    name: Vue.filter('ledgerName')(ledger.name, index),
                    address: ledger.accounts[index],
                    publicKey: ledger.publicKey,
                    index: index
                }
            }
        }

        return temp
    }

    @Emit('action')
    emitAction() { }

    openWallet() {
        if (this.wallet) {
            let group = this.wallet.publicKey || 'local'
            let aOc = this.wallet.publicKey ? this.wallet.index : this.wallet.id
            BUS.$emit('open-tab', { href: `sync://wallets/${group}/${aOc}`, mode: 'inplace-builtin' })
            this.emitAction()
        }
    }
}
</script>
