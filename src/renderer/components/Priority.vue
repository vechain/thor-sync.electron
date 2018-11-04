<template>
    <v-rating v-bind="$attrs" v-on="$listeners" v-model="rating" :length="max" dense>
        <v-icon
            small
            slot="item"
            slot-scope="props"
            :color="props.isFilled ? 'primary' : 'grey lighten-2'"
            @click="props.click"
        >mdi-rocket</v-icon>
    </v-rating>
</template>
<script lang="ts">
import { Vue, Component, Model, Emit, Watch } from 'vue-property-decorator'

@Component
export default class Priority extends Vue {
    @Model('update', { type: Number }) priority!: number
    @Emit('update')
    update(val: number) { }

    rating = 1
    readonly max = 4

    @Watch('rating')
    ratingChanged() {
        const p = Math.round((this.rating - 1) * 255 / (this.max - 1))
        this.update(Math.max(p, 0))
    }

    @Watch('priority')
    priorityChanged() {
        const r = Math.round(this.priority * (this.max - 1) / 255 + 1)
        this.rating = Math.min(Math.max(r, 1), this.max)
    }
}
</script>
