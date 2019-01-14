<template>
    <OverlayedMenu left offset-y :close-on-content-click="false" v-model="opened">
        <slot slot="activator" name="activator"/>
        <v-card width="300">
            <div v-if="rows.length>0" style="overflow:auto">
                <v-subheader
                    class="py-1"
                    style="height:auto;background-color:rgba(0,0,0,0.05)"
                >Activities</v-subheader>
                <v-divider/>
                <div style="max-height:450px;overflow-y:auto">
                    <v-expansion-panel>
                        <template v-for="row in rows">
                            <TxActivityItem
                                v-if="row.type==='tx'"
                                :key="row.id"
                                :item="row"
                                @action="opened=false"
                            />
                            <CertActivityItem
                                v-else
                                :key="row.id"
                                :item="row"
                                @action="opened=false"
                            />
                        </template>
                    </v-expansion-panel>
                </div>
            </div>
            <v-card-text v-else class="text-xs-center">No Activity</v-card-text>
        </v-card>
    </OverlayedMenu>
</template>
<script lang="ts">
import { Vue, Component, Mixins } from 'vue-property-decorator'
import TableLoader from '@/renderer/mixins/table-loader';

@Component
class AcititiesLoader extends TableLoader<entities.Activity<'tx' | 'cert'>, number> {
    table = BDB.activities
    filter = () => {
        const timeBefore = Date.now() - 24 * 3600 * 1000
        let n = 20
        return BDB.activities
            .reverse()
            .filter(a => n-- >= 0 || a.createdTime > timeBefore)
            .toArray()
    }
}

@Component
export default class ActivitiesPanel extends Mixins(AcititiesLoader) {
    opened = false
}
</script>

