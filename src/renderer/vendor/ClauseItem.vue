<template >
    <v-expansion-panel-content v-bind="$attrs" v-on="$listeners">
        <template v-if="!!clause">
            <v-layout column slot="header">
                <AddressLabel abbrev placeholder="New contract">{{clause.to}}</AddressLabel>
                <v-layout row>
                    <v-chip disabled small outline label class="ma-0 caption" style="height:18px">{{type}}</v-chip>
                    <v-flex text-xs-right>
                        <Amount sym=" VET">{{clause.value}}</Amount>
                    </v-flex>
                </v-layout>
            </v-layout>
            <v-card style="word-break:break-all;">
                <v-card-text>
                    <span>{{clause.desc}}</span>
                </v-card-text>
                <v-card-text class="pt-0">
                    <v-textarea box readonly :value="clause.data" label="Input Data" style="font-family: 'Roboto Mono', monospace">
                    </v-textarea>
                </v-card-text>
            </v-card>
        </template>
    </v-expansion-panel-content>
</template>
<script lang="ts">

import { Vue, Component, Model, Prop } from 'vue-property-decorator'
import Amount from '../components/Amount.vue'
import AddressLabel from '../components/AddressLabel.vue'
type ClauseType = Connex.Vendor.Clause

@Component({
    components: {
        Amount,
        AddressLabel
    }
})
export default class ClauseItem extends Vue {
    @Prop() clause!: ClauseType

    get type() {
        if (!this.clause.to) {
            return 'Create'
        }

        if (this.clause.data !== '0x') {
            return 'Call'
        }
        return 'Transfer'
    }
}
</script>

