<template>
    <div class="pb-2">
        <div class="py-2 px-3">
            <div class="subheading text-truncate">Transaction</div>
            <div class="text-truncate">
                <i :title="txComment">{{txComment}}</i>
            </div>
        </div>
        <v-expansion-panel expand popout class="pa-1" style="overflow:auto;">
            <ClauseItem
                tabindex="-1"
                v-for="(clause,i) in clauses"
                :key="i"
                :index="i"
                :clause="clause"
            />
        </v-expansion-panel>
    </div>
</template>

<script lang="ts">
import { Vue, Component, Prop } from 'vue-property-decorator'
@Component
export default class TxListForDialog extends Vue {
  @Prop()
  clauses?: Connex.Driver.SignTxArg

  @Prop()
  txComment?: string
}
</script>
