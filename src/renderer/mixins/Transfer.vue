<script lang="ts">
import { Vue, Component } from 'vue-property-decorator'
@Component
export default class TransferMixin extends Vue {
    name = 'transferMixin'
    filter: any
    page = -1

    createFilter(address: string) {
        this.filter = connex.thor.filter('transfer').criteria([
            {
                sender: address
            },
            {
                recipient: address
            }
        ])
    }

    resetPage() {
        this.page = 0
    }

    async getTransferAsc(pageSize: number) {
        ++this.page
        return await this.filter.apply(this.page * pageSize, pageSize)
    }

    async getTransferDesc(pageSize: number) {
        ++this.page
        return await this.filter.order('desc').apply(this.page * pageSize, pageSize)
    }
}
</script>
