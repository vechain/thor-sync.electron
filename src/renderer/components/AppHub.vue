<template>
    <v-layout v-if="appList.length" column align-center style="max-width:700px;width:100%" pa-3>
        <div class="grey--text title font-weight-light my-1">New Apps</div>
        <div style="width:100%;">
            <v-layout row wrap :justify-center="appList.length < 5">
                <div
                    v-for="app in appList"
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
        <div><a @click="openApphub">View More</a></div>
    </v-layout>
</template>

<script lang="ts">
import { Vue, Component, Prop } from 'vue-property-decorator'
import { createAccountVisitor } from '@/renderer/connex-impl/account-visitor';

@Component
export default class AppHub extends Vue {
    @Prop({default: []})
    private appList?: entities.AppHubItem[]


    navTo(app: entities.AppHubItem) {
        BUS.$emit('open-tab', {
            href: app.href,
            mode: 'inplace'
        })
    }
    openApphub(){
        BUS.$emit('open-tab', { 
            href: `https://apps.vechain.org`, 
            mode: 'append-active'
        })
    }
}
</script>

