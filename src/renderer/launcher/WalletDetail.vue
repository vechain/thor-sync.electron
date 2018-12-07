<template>
  <v-container>
    <v-layout column justify-space-around>
      <v-flex>
        <v-card v-if="wallet">
          <v-list>
            <v-list-tile avatar>
              <v-list-tile-avatar :size="90">
                <AddressLabel style="width:60px;height:40px;border-radius:5px" icon>{{wallet.address}}</AddressLabel>
              </v-list-tile-avatar>
              <v-list-tile-content>
                <v-list-tile-title>{{wallet.name}}</v-list-tile-title>
                <v-list-tile-sub-title>
                  <AddressLabel>{{wallet.address}}</AddressLabel>
                </v-list-tile-sub-title>
              </v-list-tile-content>
            </v-list-tile>
            <v-list-tile>
              <v-layout row>
                <v-spacer/>
                <v-tooltip top>
                  <v-btn v-clipboard="wallet.address" slot="activator" large icon>
                    <v-icon>mdi-content-copy</v-icon>
                  </v-btn>
                  <span>Click copy address</span>
                </v-tooltip>
                <QRCodeDialog width="300" :size="270" :content="wallet.address">
                  <div slot="activator">
                    <v-tooltip top>
                      <v-btn slot="activator" large icon>
                        <v-icon>mdi-qrcode</v-icon>
                      </v-btn>
                      <span>Show QR code</span>
                    </v-tooltip>
                  </div>
                </QRCodeDialog>
                <ExportWalletDialog
                  :address="wallet.address"
                >
                  <div slot="activator">
                    <v-tooltip top>
                      <v-btn slot="activator" large icon>
                        <v-icon>mdi-export-variant</v-icon>
                      </v-btn>
                      <span>Export Keystore</span>
                    </v-tooltip>
                  </div>
                </ExportWalletDialog>
                <v-tooltip top>
                  <v-btn @click.stop slot="activator" large icon>
                    <v-icon>mdi-lock-reset</v-icon>
                  </v-btn>
                  <span>Reset Password</span>
                </v-tooltip>
              </v-layout>
            </v-list-tile>
          </v-list>
          <v-layout row>
            <v-flex sm6 class="text-sm-center headline">
              <Amount sym=" VET">{{balance}}</Amount>
            </v-flex>
            <v-flex sm6 class="text-sm-center headline">
              <Amount sym=" VTHO">{{energy}}</Amount>
            </v-flex>
          </v-layout>
        </v-card>
      </v-flex>
      <v-flex class="mt-3">
        <v-toolbar class="elevation-0">
          <v-toolbar-title>Transfer Logs (Top 10)</v-toolbar-title>
        </v-toolbar>
        <v-data-table :loading="isloading" hide-actions :headers="headers" :items="list">
          <v-progress-linear slot="progress" color="blue" indeterminate></v-progress-linear>
          <template slot="items" slot-scope="props">
            <td class="text-xs-center">{{props.item.meta.blockTimestamp | date}}</td>
            <td class="text-xs-center">{{props.item.meta.txID | shortTxId}}</td>
            <td class="text-xs-center">{{props.item.meta.blockNumber.toLocaleString()}}</td>
            <td class="text-xs-center">{{props.item.sender | shortAddr}}</td>
            <td class="text-xs-center">{{props.item.recipient | shortAddr}}</td>
            <td class="text-xs-left">
              <v-icon
                color="orange darken-1"
                small
                v-if="props.item.sender === address"
              >mdi-inbox-arrow-up</v-icon>
              <v-icon color="green lighten-1" small v-else>mdi-inbox-arrow-down</v-icon>
              {{props.item.amount | balance}}
            </td>
          </template>
        </v-data-table>
      </v-flex>
    </v-layout>
  </v-container>
</template>
<script lang="ts">
  import { Vue, Component, Watch, Prop, Mixins } from 'vue-property-decorator'
  import TransferMixin from '../mixins/Transfer.vue'
  import { State } from 'vuex-class'
  import Store from '../store'
  import { Num } from '@/common/formatter'
  import ExportWalletDialog from './ExportWalletDialog.vue'
  import { Entities } from '../database'
  import AccountLoader from '../mixins/account-loader'
  import { setTimeout } from 'timers'
  @Component({
      components: {
          ExportWalletDialog
      }
  })
  export default class WalletDetail extends Mixins(TransferMixin, AccountLoader) {
      name = 'walletDetail'
      wallet: Entities.Wallet | null = null
      list: Connex.Thor.Transfer[] = []
      get address() {
          return (this.wallet ? this.wallet.address : '') || ''
      }
      isloading = true

      headers = [
          {
              text: 'Date',
              align: 'center',
              sortable: false
          },
          {
              text: 'TxID',
              align: 'center',
              sortable: false
          },
          {
              text: 'Block #',
              align: 'center',
              sortable: false
          },
          {
              text: 'From',
              align: 'center',
              sortable: false
          },
          {
              text: 'To',
              align: 'center',
              sortable: false
          },
          {
              text: 'Value',
              align: 'left',
              sortable: false
          }
      ]

      async created() {
          const address = this.$route.params.address
          this.wallet =
              (await BDB.wallets
                  .where('address')
                  .equalsIgnoreCase(address)
                  .first()) || null
          this.createFilter(address)
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

