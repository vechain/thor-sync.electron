<template>
    <v-app id="app">
        <v-navigation-drawer dense fixed :clipped="$vuetify.breakpoint.mdAndUp" app v-model="drawer">
            <side-list />
        </v-navigation-drawer>
        <v-toolbar color="blue-grey lighten-1" dark app :clipped-left="$vuetify.breakpoint.mdAndUp" fixed>
            <v-toolbar-title style="width: 300px" class="ml-0 pl-3">
                <v-toolbar-side-icon @click.stop="drawer = !drawer"></v-toolbar-side-icon>
                <span>Api Demo</span>
            </v-toolbar-title>
        </v-toolbar>
        <v-content>
            <v-container>
                <router-view></router-view>
            </v-container>
        </v-content>
    </v-app>
</template>

<script lang="ts">
import { Vue, Component } from 'vue-property-decorator'
import SideList from './components/SideList.vue'
@Component({
    components: {
        SideList
    }
})
export default class App extends Vue {
    name: string = 'app'
    public drawer:boolean = false
}
</script>
