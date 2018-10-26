<template>
    <OverlayedMenu
        v-if="records.length > 0"
        left
        offset-y
        :close-on-content-click="false"
        max-height="500px"
        max-width="300px"
        min-width="300px"
        v-model="opened"
    >
        <v-btn flat light small slot="activator">activity</v-btn>
        <v-card>
            <v-expansion-panel expand>
                <TxRecord v-for="rec in records" :key="rec.id" :entity="rec"/>
            </v-expansion-panel>
        </v-card>
    </OverlayedMenu>
</template>
<script lang="ts">
import { Vue, Component, Watch } from 'vue-property-decorator'
import { State } from 'vuex-class'
import OverlayedMenu from './OverlayedMenu.vue'
import TxRecord from './TxRecord.vue'
import { Entities } from '@/renderer/database'

@Component({
    components: {
        OverlayedMenu,
        TxRecord
    }
})
export default class TxRecordsPanel extends Vue {
    opened = false
    records: Entities.TxRecord[] = []

    @State txRecordsRevision!: number
    @Watch('txRecordsRevision')
    async reload() {
        try {
            this.records = await DB.txRecords
                .orderBy('insertTime')
                .reverse()
                .limit(10)
                .toArray()
        } catch (err) {
            console.error(err)
        }
    }
    created() {
        this.reload()
    }
}
</script>

