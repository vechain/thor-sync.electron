<template>
    <v-list>
        <template v-for="item in items">
            <v-layout row v-if="item.heading" align-center :key="item.heading">
                <v-flex xs6>
                    <v-subheader v-if="item.heading">
                        {{ item.heading }}
                    </v-subheader>
                </v-flex>
                <v-flex xs6 class="text-xs-center">
                    <a href="#!" class="body-2 black--text">EDIT</a>
                </v-flex>
            </v-layout>
            <v-list-group v-else-if="item.children" v-model="item.model" :key="item.text" :prepend-icon="item.model ? item.icon : item['icon-alt']"
                append-icon="">
                <v-list-tile slot="activator">
                    <v-list-tile-content>
                        <v-list-tile-title>
                            {{ item.text }}
                        </v-list-tile-title>
                    </v-list-tile-content>
                </v-list-tile>
                <v-list-tile active-class="side-list-active" v-for="(child, i) in item.children" :key="i" :to="child.path">
                    <v-list-tile-action v-if="child.icon">
                        <v-icon>{{ child.icon }}</v-icon>
                    </v-list-tile-action>
                    <v-list-tile-content>
                        <v-list-tile-title>
                            {{ child.text }}
                        </v-list-tile-title>
                    </v-list-tile-content>
                </v-list-tile>
            </v-list-group>
            <v-list-tile v-else @click="" :key="item.text">
                <v-list-tile-action>
                    <v-icon>{{ item.icon }}</v-icon>
                </v-list-tile-action>
                <v-list-tile-content>
                    <v-list-tile-title>
                        {{ item.text }}
                    </v-list-tile-title>
                </v-list-tile-content>
            </v-list-tile>
        </template>
    </v-list>
</template>
<script lang="ts">
import { Vue, Component, Prop } from 'vue-property-decorator'
@Component
export default class SideList extends Vue {
    @Prop({ default: false })
    public show!: boolean

    name: string = 'side_list'
    public items: any[] = [
        {
            text: 'Api list'
        },
        {
            icon: 'keyboard_arrow_up',
            'icon-alt': 'keyboard_arrow_down',
            text: 'Connex',
            model: false,
            children: [
                { icon: 'person', text: 'User', path: {name: 'user.index'} },
                { icon: 'leak_add', text: 'Thor', path: {name: 'thor.clause'} },
                { icon: 'details', text: 'Vendor', path: {name: 'vendor.index'} }
            ]
        },
        { icon: 'chat_bubble', text: 'Send feedback' },
        { icon: 'help', text: 'Help' }
    ]
}
</script>
<style lang="scss">
.side-list-active.v-list__tile--active {
    background-color: #dedede;
    color: #FF8F00;
}
</style>
