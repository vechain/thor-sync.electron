<template>
  <div class="pa-3">
    <div style="max-width: 1000px; width: 100%; margin: 0 auto;">
      <div>
        <v-layout justify-center>
          <router-link tag="span" :to="{name: 'transfer', query: {address: wallet.address}}">
            <v-btn flat small class="caption" color="primary">transfer</v-btn>
          </router-link>
          <ExportWalletDialog :wallet="wallet">
            <v-btn flat small right class="caption" color="primary" slot="activator">Backup</v-btn>
          </ExportWalletDialog>
        </v-layout>
      </div>
      <v-card class="elevation-0" v-if="wallet">
        <v-layout justify-space-around>
          <v-flex xs9>
            <v-list>
              <v-list-tile avatar>
                <v-list-tile-avatar :size="90">
                  <AddressLabel
                    style="width:70px;height:50px;border-radius:5px"
                    icon
                  >{{wallet.address}}</AddressLabel>
                </v-list-tile-avatar>
                <v-list-tile-content>
                  <v-card class="elevation-0">
                    <v-card-title
                      style="max-width: 300px"
                      class="title d-block pa-0 pt-1 text-truncate"
                    >{{wallet.name}}</v-card-title>
                    <v-card-text class="caption pa-0 pt-1">
                      <v-layout row align-content-center>
                        <v-flex align-self-center>
                          <AddressLabel class="grey--text text--darken-1">{{wallet.address}}</AddressLabel>
                        </v-flex>
                        <v-flex>
                          <v-tooltip top>
                            <v-btn
                              class="ma-0 ml-3"
                              v-clipboard="wallet.address"
                              slot="activator"
                              small
                              icon
                            >
                              <v-icon small>mdi-content-copy</v-icon>
                            </v-btn>
                            <span>Click copy address</span>
                          </v-tooltip>
                          <QRCodeDialog width="300" :size="270" :content="wallet.address">
                            <div slot="activator">
                              <v-tooltip top>
                                <v-btn class="ma-0" slot="activator" small icon>
                                  <v-icon small>mdi-qrcode</v-icon>
                                </v-btn>
                                <span>Show QR code</span>
                              </v-tooltip>
                            </div>
                          </QRCodeDialog>
                        </v-flex>
                      </v-layout>
                    </v-card-text>
                  </v-card>
                </v-list-tile-content>
              </v-list-tile>
            </v-list>
          </v-flex>
          <v-flex xs3>
            <v-list class="mt-2">
              <v-list-tile>
                <v-divider inset vertical></v-divider>
                <v-list-tile-content>
                  <v-layout column style="width: 100%;">
                    <v-flex class="text-xs-right">
                      <Amount sym=" VET ">{{balance}}</Amount>
                    </v-flex>
                    <v-flex class="text-xs-right">
                      <Amount sym=" VTHO">{{energy}}</Amount>
                    </v-flex>
                  </v-layout>
                </v-list-tile-content>
              </v-list-tile>
            </v-list>
          </v-flex>
        </v-layout>
      </v-card>
      <v-layout justify-space-around>
        <v-flex xs3 sm2 class="mt-3">
          <div class="pt-1">
            <ResetPwdDialog :wallet="wallet">
              <v-btn right class="t-left" color="primary" flat slot="activator" small>Reset Password</v-btn>
            </ResetPwdDialog>
            <DeleteWalletDialog :wallet="wallet">
              <v-btn right class="t-left" color="error" flat slot="activator" small>Delete</v-btn>
            </DeleteWalletDialog>
          </div>
        </v-flex>
        <v-flex xs9 sm10 class="mt-1">
          <h3 flat v-if="list.length" class="pl-0 pt-4 pb-4 title">Recent Transfer</h3>
          <v-progress-linear v-if="isloading" :indeterminate="true"></v-progress-linear>
          <div class="text-xs-center" >
            <v-btn style="margin-top: 200px" flat :disabled="isloading" v-if="!list.length" @click="getList">
              <v-icon medium left>search</v-icon>Load Transfer log
            </v-btn>
          </div>
          <TransferItem
            :isIn="item.sender !== address"
            :item="item"
            v-for="(item, i) in list "
            :key="i"
          />
        </v-flex>
      </v-layout>
    </div>
  </div>
</template>
<script lang="ts">
  import { Vue, Component, Watch, Prop, Mixins } from 'vue-property-decorator'
  import TransferMixin from '../mixins/Transfer.vue'
  import { State } from 'vuex-class'
  import Store from '../store'
  import { Num } from '@/common/formatter'
  import ExportWalletDialog from './ExportWalletDialog.vue'
  import ResetPwdDialog from './ResetPwdDialog.vue'
  import DeleteWalletDialog from './DeleteWalletDialog.vue'
  import TransferItem from './TransferItem.vue'
  import { Entities } from '../database'
  import AccountLoader from '../mixins/account-loader'
  import { setTimeout } from 'timers'
  import { Stats } from 'fs'
  @Component({
      components: {
          ExportWalletDialog,
          ResetPwdDialog,
          DeleteWalletDialog,
          TransferItem
      }
  })
  export default class WalletDetail extends Mixins(TransferMixin, AccountLoader) {
      name = 'walletDetail'
      // wallet: Entities.Wallet | null = null
      list: Connex.Thor.Transfer[] = []
      get address() {
          return (this.wallet ? this.wallet.address : '') || ''
      }
      isloading = false

      get wallet() {
          return this.wallets.find(item => {
              return item.address === this.$route.params.address
          })
      }

      @State
      wallets!: Entities.Wallet[]

      created() {
          const address = this.$route.params.address
          this.createFilter(address)
      }

      async getList() {
          this.isloading = true
          this.list = await this.getTransferDesc(10)
          this.isloading = false
      }

      get balance() {
          return this.account && this.account.balance
      }

      get energy() {
          return this.account && this.account.energy
      }
  }
</script>

<style>
  .t-left .v-btn__content {
      justify-content: left;
  }
</style>
