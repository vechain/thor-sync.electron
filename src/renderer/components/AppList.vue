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
import { Vue, Prop, Component, Emit } from 'vue-property-decorator'
import { Entities } from '@/renderer/database'

@Component
export default class DApps extends Vue {
    private apps: Dapp.Item[] = [
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
        }
    ]

    private DApi: Dapp.Item = {
        name: 'api',
        newTab: true,
        src: new URL(`api.html`, ENV.dapps).href
    }

    async created() {
        ENV.devMode ? this.apps.push(this.DApi) : this.apps
        this.apps = this.apps.concat(await this.getShortcuts())
    }

    async getShortcuts() {
        const list = await DB.preferences
            .where('key')
            .equals('shortcut')
            .reverse()
            .sortBy('id')

        return list.map<any>(item => {
            return {
                name: item.value.name,
                newTab: true,
                src: `http://${item.value.domain}`
            }
        })
    }

    openDapp(data: Dapp.Item) {
        if (data.newTab) {
            BUS.$emit('open-dapp', data)
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

