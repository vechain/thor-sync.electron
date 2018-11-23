<template>
    <OverlayedMenu left offset-y :close-on-content-click="false" v-model="opened">
        <slot slot="activator" name="activator"/>
        <v-card width="300">
            <template v-if="showContent">
                <template v-if="rows.length>0">
                    <v-subheader
                        class="py-1"
                        style="height:auto;background-color:rgba(0,0,0,0.05)"
                    >Activities</v-subheader>
                    <v-divider/>
                    <div style="max-height:450px;overflow-y:scroll">
                        <v-expansion-panel>
                            <TxRecord v-for="rec in rows" :key="rec.id" :entity="rec"/>
                        </v-expansion-panel>
                    </div>
                </template>
                <v-card-text v-else class="text-xs-center">No Activity</v-card-text>
            </template>
        </v-card>
    </OverlayedMenu>
</template>
<script lang="ts">
import { Vue, Component, Mixins, Watch } from 'vue-property-decorator'
import TableLoader from '../mixin/table-loader'
import debounce from 'lodash.debounce'
import { Entities } from '@/renderer/database';

@Component
class TxRecordsLoader extends TableLoader<Entities.TxRecord>{
    tableName = DB.txRecords.name
    filter = () => {
        return DB.txRecords
            .where('insertTime')
            .above(Date.now() - 24 * 3600 * 1000)
            .reverse()
            .sortBy('insertTime')
    }
}

@Component
export default class TxRecordsPanel extends Mixins(TxRecordsLoader) {
    opened = false

    showContent = false

    updateShowContent !: () => void

    created() {
        this.updateShowContent = debounce(() => {
            this.showContent = this.opened
        }, 200)
    }

    @Watch('opened')
    openedChanged() {
        if (this.opened) {
            this.showContent = true
        } else {
            this.updateShowContent()
        }
    }
}
</script>

