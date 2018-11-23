<template>
    <div class="sync-dapp-list">
        <div>
            <slot/>
            <v-container class="dapp-container">
                <v-hover v-for="item in apps" :key="item.id" :close-delay="0">
                    <v-card
                        slot-scope="{hover}"
                        :class="`elevation-${hover ? 8 : 2}`"
                        class="dapp-item"
                    >
                        <v-img height="100px"></v-img>
                        <v-card-actions>
                            <v-spacer></v-spacer>
                            <v-btn @click.stop="openDapp(item)" flat>{{item.name}}</v-btn>
                        </v-card-actions>
                    </v-card>
                </v-hover>
            </v-container>
        </div>
    </div>
</template>

<script lang="ts">
import { Vue, Prop, Component, Emit, Mixins } from 'vue-property-decorator'
import { Entities } from '@/renderer/database'
import TableLoader from '../mixin/table-loader'

@Component
class ShortcutsLoader extends TableLoader<Entities.Preference<'shortcut'>> {
    tableName = DB.preferences.name
    filter = () => DB.preferences
        .where('key')
        .equals('shortcut')
        .sortBy('id')
}

@Component
export default class DApps extends Mixins(ShortcutsLoader) {

    get apps() {
        return [
            {
                name: 'Insight',
                newTab: true,
                src: new URL(`insight.html`, ENV.dapps).href
            },
            {
                name: 'Wallets',
                newTab: false,
                src: {
                    name: 'wallets'
                }
            },
            {
                name: 'Settings',
                newTab: false,
                src: {
                    name: 'settings'
                }
            },
            {
                name: 'api',
                newTab: true,
                src: new URL(`api.html`, ENV.dapps).href
            }
        ].concat(this.rows.map(r => {
            return {
                name: r.value.name,
                newTab: true,
                src: r.value.href
            }
        }))
    }

    openDapp(data: Dapp.Item) {
        if (data.newTab) {
            BUS.$emit('open-tab', {
                href: data.src,
                title: data.name,
                mode: 'inplace'
            })
        } else {
            this.$router.push(data.src)
        }
    }
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

