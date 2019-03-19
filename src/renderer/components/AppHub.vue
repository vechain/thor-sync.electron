<template>
    <v-layout v-if="apps.length" column align-center style="max-width:700px;width:100%" pa-3>
        <div class="grey--text title font-weight-light my-1">New on App-Hub</div>
        <div style="width:100%;">
            <v-layout row wrap :justify-center="apps.length < 5">
                <div
                    v-for="app in apps"
                    :key="app.id"
                    class="py-1 px-2"
                    style="flex:0 1 20%;max-width:20%;"
                >
                    <AppHubItem
                        :title="app.name"
                        :href="app.href"
                        :src="app.img"
                        @click="navTo(app)"
                    ></AppHubItem>
                </div>
            </v-layout>
        </div>
        <!-- <div><a href="">More...</a></div> -->
    </v-layout>
</template>

<script lang="ts">
import { Vue, Component, Prop } from 'vue-property-decorator'
import { createAccountVisitor } from '@/renderer/connex-impl/account-visitor';

declare interface AppHubItem {
    name: string,
    href: string,
    desc: string,
    tags: string[],
    id: string,
    createAt: number
}

@Component
export default class AppHub extends Vue {
    private appList: AppHubItem[] = []

    navTo(app: AppHubItem) {
        BUS.$emit('open-tab', {
            href: app.href,
            mode: 'inplace'
        })
    }

    created() {
        this.getApps()
    }

    get apps() {
        return this.appList.map((item: AppHubItem) => {
            return {
                ...item,
                img: `https://vechain.github.io/app-hub/imgs/${item.id}.png`
            }
        })
    }

    public async getApps() {
        try {
            const resp = await fetch('https://vechain.github.io/app-hub/index.json', {
                method: 'GET',
                mode: 'cors',
                cache: 'no-cache',
                referrer: 'no-referrer'
            })

            this.appList = await resp.json()
        } catch (error) {

        }
    }
}
</script>

