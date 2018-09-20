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
                        <!-- <v-menu full-width offset-y origin="center center" transition="scale-transition">
                            <v-btn slot="activator" @click="getAccounts">
                                {{item.name}}
                            </v-btn>
                            <v-list>
                                <v-list-tile v-for="(account, i) in accounts" :key="i" @click="openDapp({src: item.src, name: item.name, addressBar: item.needAddress, account: account.address})">
                                    <v-list-tile-content>
                                        <v-list-tile-title>{{ account.name }}</v-list-tile-title>
                                        <v-list-tile-sub-title>{{ account.address }}</v-list-tile-sub-title>
                                    </v-list-tile-content>
                                </v-list-tile>
                            </v-list>
                        </v-menu> -->
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
    private apps = ENV.devMode ?
        ['insight', 'wallet', 'api'] :
        ['insight', 'wallet']

    // private accounts: any[] = []

    // public getAccounts() {
    //     walletStore.list().then(list => {
    //         this.accounts = list.map(item => {
    //             return {
    //                 address: item.address,
    //                 name: item.name
    //             }
    //         })
    //     })
    // }

    get list() {
        return this.apps.map<Dapp.Item>(item => {
            return {
                name: item,
                src: new URL(`${item}.html`, ENV.dapps).href,
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

