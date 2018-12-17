<template>
  <div class="pa-3">
    <div style="max-width: 1000px; width: 100%; margin: 0 auto;">
      <div>
        <v-layout justify-center>
          <router-link tag="span" to="/transfer">
            <v-btn flat small class="caption" color="primary">transfer</v-btn>
          </router-link>
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
                  <v-list-tile-title class="mt-1 mb-1 title">{{wallet.name}}</v-list-tile-title>
                  <v-list-tile-sub-title class="pb-1">
                    <AddressLabel class="caption">{{wallet.address}}</AddressLabel>
                    <v-tooltip top>
                      <v-btn v-clipboard="wallet.address" slot="activator" small icon>
                        <v-icon small>mdi-content-copy</v-icon>
                      </v-btn>
                      <span>Click copy address</span>
                    </v-tooltip>
                    <QRCodeDialog width="300" :size="270" :content="wallet.address">
                      <div slot="activator">
                        <v-tooltip top>
                          <v-btn slot="activator" small icon>
                            <v-icon small>mdi-qrcode</v-icon>
                          </v-btn>
                          <span>Show QR code</span>
                        </v-tooltip>
                      </div>
                    </QRCodeDialog>
                  </v-list-tile-sub-title>
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
                      <Amount sym=" VET">{{balance}}</Amount>
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
            <ExportWalletDialog :wallet="wallet">
              <v-btn right class="t-left" color="primary" flat slot="activator" small>Backup</v-btn>
            </ExportWalletDialog>
            <DeleteWalletDialog :wallet="wallet">
              <v-btn right class="t-left" color="error" flat slot="activator" small>Delete</v-btn>
            </DeleteWalletDialog>
          </div>
        </v-flex>
        <v-flex xs8 sm9 class="mt-1">
          <h3 class="pa-4 title">Recent Transfer</h3>
          <v-progress-linear v-if="isloading" :indeterminate="true"></v-progress-linear>
          <div class="text-xs-center pl-4">
            <v-btn flat v-if="!list.length" @click="getList">
              <v-icon medium left>search</v-icon>Load Transfer log
            </v-btn>
            <TransferItem
              :isIn="item.sender !== address"
              :item="item"
              v-for="(item, i) in list "
              :key="i"
            />
          </div>
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
          console.log(this.list)
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
