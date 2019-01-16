<template>
    <Tooltip>
        <v-icon
            slot="activator"
            :color="pendings ? 'info':''"
            style="font-size:150%;margin-top:2px"
        >{{pendings ? 'mdi-progress-upload':'mdi-arrow-up-bold-circle-outline'}}</v-icon>
        <span>{{pendings? `${pendings} pending ${pendings===1?'activity': 'activities'}`: 'No activity'}}</span>
    </Tooltip>
</template>
<script lang="ts">
import { Vue, Component, Mixins } from 'vue-property-decorator'
import TableLoader from '../mixins/table-loader'

@Component
class ActivitiesLoader extends TableLoader<entities.Activity<'tx' | 'cert'>, number> {
    table = BDB.activities
    filter = () => {
        return BDB.activities
            .where({ closed: 0 })
            .toArray()
    }
}

@Component
export default class ActivtyStatus extends Mixins(ActivitiesLoader) {
    get pendings() {
        return this.rows.length
    }
}
</script>

