<template>
    <v-icon
        :color="pendingCount>0?'primary':''"
        small
        style="font-size:150%;"
    >{{pendingCount > 0 ? 'mdi-progress-upload':'mdi-arrow-up-bold-circle-outline'}}</v-icon>
</template>
<script lang="ts">
import { Vue, Component, Mixins } from 'vue-property-decorator'
import { remote } from 'electron'
import { Entities } from '@/renderer/database'
import TableLoader from '../mixins/table-loader'

@Component
class TxRecordsLoader extends TableLoader<Entities.TxRecord> {
    tableName = DB.txRecords.name
    filter = () => {
        return DB.txRecords
            .where('insertTime')
            .above(Date.now() - 3 * 3600 * 1000)
            .toArray()
    }
}

@Component
export default class Activty extends Mixins(TxRecordsLoader) {
    timestamp = 0

    get pendingCount() {
        // reference to update timely
        this.timestamp
        return this.rows.filter(r => {
            if (r.confirmed) {
                return false
            }
            const status = connex.txQueue.status(r.id)
            return status === 'sending' || status === 'sent'
        }).length
    }

    timer!: any

    created() {
        this.timer = setInterval(() => this.timestamp = Date.now(), 2000)
    }

    destroyed() {
        clearInterval(this.timer)
    }
}
</script>

