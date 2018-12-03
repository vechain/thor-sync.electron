<template >
    <v-expansion-panel-content v-bind="$attrs" v-on="$listeners">
        <v-layout column slot="header">
            <v-layout row align-baseline>
                <span class="grey--text caption">Clause {{index+1}}</span>
                <v-spacer/>
                <b class="label primary text-uppercase">{{type}}</b>
            </v-layout>
            <v-layout row align-baseline>
                <span class="caption">To:
                    <AddressLabel abbrev placeholder="New contract">{{clause.to}}</AddressLabel>
                </span>
                <v-spacer/>
                <Amount sym=" VET" class="body-1">{{clause.value}}</Amount>
            </v-layout>
        </v-layout>
        <v-card style="word-break:break-all;">
            <v-card-text class="pt-1">
                <i>{{clause.comment}}</i>
            </v-card-text>
            <v-card-text v-show="!!clause.data" class="pt-0">
                <v-textarea
                    tabindex="-1"
                    class="caption"
                    box
                    readonly
                    :value="clause.data"
                    label="Input Data"
                    style="font-family: 'Roboto Mono', monospace"
                ></v-textarea>
            </v-card-text>
        </v-card>
    </v-expansion-panel-content>
</template>
<script lang="ts">

import { Vue, Component, Model, Prop } from 'vue-property-decorator'
type ClauseType = Connex.Vendor.SigningService.Message<'tx'>['clauses'][number]

@Component
export default class ClauseItem extends Vue {
    @Prop(Object) clause!: ClauseType
    @Prop(Number) index!: number

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
