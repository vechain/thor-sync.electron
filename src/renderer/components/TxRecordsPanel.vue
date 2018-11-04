<template>
    <OverlayedMenu left offset-y :close-on-content-click="false" v-model="opened">
        <v-btn flat light small slot="activator">activity</v-btn>
        <v-card width="300">
            <template v-if="showContent">
                <template v-if="records.length>0">
                    <v-subheader
                        class="py-1"
                        style="height:auto;background-color:rgba(0,0,0,0.05)"
                    >Activities</v-subheader>
                    <v-divider/>
                    <div style="max-height:450px;overflow-y:scroll">
                    <v-expansion-panel>
                        <TxRecord v-for="rec in records" :key="rec.id" :entity="rec"/>
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
import OverlayedMenu from './OverlayedMenu.vue'
import TxRecord from './TxRecord.vue'
import TxRecordsLoader from '../mixin/tx-records-loader'
import * as _ from 'lodash'

@Component({
    components: {
        OverlayedMenu,
        TxRecord
    }
})
export default class TxRecordsPanel extends Mixins(TxRecordsLoader) {
    opened = false

    showContent = false

    // override
    limit = { offset: 0, count: 10 }

    updateShowContent !: ()=>void

    created() {
        this.updateShowContent = _.debounce(() =>{
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

