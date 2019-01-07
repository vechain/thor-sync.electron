<template>
    <v-icon
        :color="hasPending ? 'info':''"
        style="font-size:150%;"
    >{{hasPending ? 'mdi-progress-upload':'mdi-arrow-up-bold-circle-outline'}}</v-icon>
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
    get hasPending() {
        return this.rows.length > 0
    }
}
</script>

