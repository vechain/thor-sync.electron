<template >
    <v-expansion-panel-content v-bind="$attrs" v-on="$listeners">
        <v-layout row align-center slot="header">
            <v-flex xs1>
                <span class="grey--text caption"># {{index+1}}</span>
            </v-flex>
            <v-flex xs11>
                <v-layout align-baseline>
                    <span class="caption">
                        To:
                        <AddressLabel abbrev placeholder="New Contract">{{clause.to}}</AddressLabel>
                    </span>
                    <v-spacer/>
                    <b class="label primary text-uppercase">{{type}}</b>
                </v-layout>
                <v-layout align-baseline>
                    <span style="max-width: 350px" class="pt-1 grey--text text-truncate">
                        <i :title="clause.comment">{{clause.comment || 'No comment'}}</i>
                    </span>
                    <v-spacer/>
                    <Amount sym=" VET" class="body-1">{{clause.value}}</Amount>
                </v-layout>
            </v-flex>
        </v-layout>
        <template v-if="clause.data!=='0x'">
            <v-divider/>
            <v-card>
                <v-card-text class="pt-0">
                    <v-tabs height="35" v-model="active">
                        <v-tab>Raw</v-tab>
                        <v-tab v-if="type==='Call'">Decoded</v-tab>
                        <v-tab-item>
                            <v-textarea
                                tabindex="-1"
                                class="caption"
                                box
                                readonly
                                :value="clause.data"
                                label="Input Data"
                                style="font-family: 'Roboto Mono', monospace"
                            ></v-textarea>
                        </v-tab-item>
                        <v-tab-item v-if="type==='Call'">
                            <Decoded :value="{data: clause.data, abiHint: clause.abi}"/>
                        </v-tab-item>
                    </v-tabs>
                </v-card-text>
            </v-card>
        </template>
    </v-expansion-panel-content>
</template>
<script lang="ts">

import { Vue, Component, Model, Prop } from 'vue-property-decorator'
type ClauseType = Connex.Vendor.TxMessage[number]

@Component
export default class ClauseItem extends Vue {
    @Prop(Object) clause!: ClauseType
    @Prop(Number) index!: number

    active: number = 0

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
