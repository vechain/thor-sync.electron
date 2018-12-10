<template>
    <div>
        <Update></Update>
        <Networks></Networks>
    </div>
</template>
<script lang="ts">
import { Vue, Component } from 'vue-property-decorator'
import Networks from './Networks.vue'
import Update from './Update.vue'

@Component({
    components: {
        Networks,
        Update
    }
})
export default class Settings extends Vue {
    name: string = 'settings'
    active = 0
    tabs = ['Shortcuts', 'Networks', 'Update']
}
</script>

