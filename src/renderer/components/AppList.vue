<template>
    <div class="sync-dapp-list">
        <div>
            <slot/>
            <v-container class="dapp-container">
                <v-card v-for="item in list" :key="item.id" class="dapp-item">
                    <v-img height="100px">
                    </v-img>
                    <v-card-actions>
                        <v-spacer></v-spacer>
                        <v-btn @click.stop="openDapp({url: item.url})" flat>{{item.name}}</v-btn>
                    </v-card-actions>
                </v-card>
            </v-container>
        </div>
    </div>
</template>

<script lang="ts">
import { Vue, Prop, Component, Emit } from 'vue-property-decorator'
import { portData } from './ViewPort.vue'

@Component
export default class DApps extends Vue {
    @Prop() private list!: DApp[]

    @Emit('open-dapp')
    openDapp(data: portData) {}
}
</script>

<style lang="scss" scoped>
.sync-dapp-list div.dapp-container {
    display: grid;
    grid-template-columns: 160px 160px 160px 160px 160px 160px;
    grid-column-gap: 20px;
    grid-row-gap: 30px;
    justify-content: center;
}

@media screen and (max-width: 1200px) {
    .sync-dapp-list div.dapp-container {
        grid-template-columns: 160px 160px 160px 160px;
    }
}
</style>

