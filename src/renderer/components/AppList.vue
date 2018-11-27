<template>
    <div class="sync-dapp-list">
        <div>
            <slot/>
            <v-container class="dapp-container">
                <AppButton
                    v-for="item in apps"
                    :key="item.id"
                    :title="item.name"
                    :href="item.src"
                    :favicon="favicons[item.src]"
                    @click="openDapp(item)"
                />
            </v-container>
        </div>
    </div>
</template>

<script lang="ts">
import { Vue, Prop, Component, Emit, Mixins } from 'vue-property-decorator'
import { Entities } from '@/renderer/database'
import TableLoader from '../mixins/table-loader'
import *as NodeUrl from 'url'

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
    favicons: { [href: string]: string } = {}

    get apps() {
        const apps = [
            {
                name: 'Insight',
                newTab: true,
                src: new URL(`insight.html`, ENV.dapps).href
            },
            {
                name: 'Wallets',
                newTab: false,
                src: 'sync://wallets'
            },
            {
                name: 'Settings',
                newTab: false,
                src: 'sync://settings'
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

        apps.forEach(app => {
            DB.history.get({ 'href': app.src }).then(r => {
                if (r) {
                    return r.favicon
                }
                const hostname = NodeUrl.parse(app.src).hostname || app.src

                return DB.history
                    .where('tokens')
                    .startsWithIgnoreCase(hostname)
                    .limit(1)
                    .toArray().then(recs => {
                        if (recs.length > 0) {
                            return recs[0].favicon
                        }
                    })
            }).then(favicon => {
                if (favicon) {
                    this.$set(this.favicons, app.src, favicon)
                }
            }).catch(console.warn)
        })
        return apps
    }

    openDapp(data: Dapp.Item) {
        BUS.$emit('open-tab', {
            href: data.src,
            title: data.name,
            mode: 'inplace'
        })
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

