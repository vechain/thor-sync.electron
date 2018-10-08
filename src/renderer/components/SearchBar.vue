<template>
    <v-toolbar v-bind="$attrs">
        <v-btn icon>
            <v-icon>arrow_back</v-icon>
        </v-btn>
        <v-btn icon>
            <v-icon>arrow_forward</v-icon>
        </v-btn>
        <v-btn icon>
            <v-icon>refresh</v-icon>
        </v-btn>
        <v-text-field></v-text-field>
        <slot/>
    </v-toolbar>
</template>

<script lang="ts">
import { Component, Prop, Vue, Emit } from 'vue-property-decorator'

@Component
export default class SearchBar extends Vue {
    @Prop({ default: '' })
    private account!: string

    private origin: string = ''
    private url: string = ''
}
</script>
