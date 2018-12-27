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
                <div style="max-height:450px;overflow-y:scroll">
                    <v-expansion-panel>
                        <template v-for="row in rows">
                            <TxActivityItem v-if="row.type==='tx'" :key="row.id" :item="row"/>
                            <CertActivityItem v-else :key="row.id" :item="row"/>
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
class AcititiesLoader extends TableLoader<entities.Activity<'tx' | 'cert'>> {
    tableName = BDB.activities.name
    filter = () => {
        return BDB.activities
            .where('createdTime')
            .above(Date.now() - 24 * 3600 * 1000)
            .reverse()
            .sortBy('createdTime')
    }
}

@Component
export default class ActivitiesPanel extends Mixins(AcititiesLoader) {
    opened = false
}
</script>

