<template>
    <v-card class="elevation-0">
        <v-list>
            <v-list-tile avatar>
                <v-list-tile-avatar :size="40">
                    <v-icon
                        style="font-size: 19px"
                        color="green lighten-1"
                        v-if="isIn"
                    >mdi-arrow-right-thick</v-icon>
                    <v-icon style="font-size: 19px" color="red darken-1" v-else>mdi-arrow-left-thick</v-icon>
                </v-list-tile-avatar>
                <v-list-tile-content>
                    <v-list-tile-sub-title class="mt-2">
                        <v-layout>
                            <v-flex xs6>
                                <span
                                    class="body-2 grey--text text--darken-4 font-weight-regular"
                                >TX#: {{item.meta.txID | shortTxId}}</span>
                                <br>
                                <span class="body-2 grey--text text--darken-4 font-weight-light">
                                    <span
                                        class="font-weight-light font-italic"
                                    >{{ isIn ? 'Recieved from: ' : 'Transferred to: '}}
                                    </span>
                                    {{ (isIn ? item.sender : item.recipient) | shortAddr}}
                                </span>
                            </v-flex>
                            <v-flex xs6 class="text-xs-right caption">
                                <span>{{item.meta.blockTimestamp | dateTime}}</span>
                                <br>
                                <p class="mt-2 pr-1 body-2 grey--text text--darken-4">
                                    {{isIn ? "+" : "-"}}
                                    <Amount sym=" VET">{{item.amount}}</Amount>
                                </p>
                            </v-flex>
                        </v-layout>
                    </v-list-tile-sub-title>
                </v-list-tile-content>
            </v-list-tile>
        </v-list>
    </v-card>
</template>
<script lang="ts">
    import { Vue, Component, Watch, Prop, Mixins } from 'vue-property-decorator'
    @Component
    export default class TransferItem extends Vue {
        @Prop()
        item?: Connex.Thor.Transfer | null

        @Prop(Boolean)
        isIn!: boolean
    }
</script>
