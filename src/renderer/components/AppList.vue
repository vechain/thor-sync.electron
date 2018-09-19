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
                        <v-btn @click.stop="openDapp({src: item.src, name: item.name, addressBar: item.needAddress})" flat>{{item.name}}</v-btn>
                    </v-card-actions>
                </v-card>
            </v-container>
        </div>
    </div>
</template>

<script lang="ts">
import { Vue, Prop, Component, Emit } from 'vue-property-decorator'

@Component
export default class DApps extends Vue {
    private apps = !window.ENV.devMode ? ['insight', 'wallet'] : ['insight', 'wallet', 'api']

    get list() {
        return this.apps.map<Dapp.Item>(item => {
            return {
                name: item,
                src: new URL(`${item}.html`, window.ENV.dapps).href,
                needAddress: item !== 'api'
            }
        })
    }

    @Emit('open-dapp')
    openDapp(data: Dapp.Item) { }
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

