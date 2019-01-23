<template>
    <v-rating
        v-bind="$attrs"
        v-on="$listeners"
        v-model="rating"
        :length="max"
        dense
        :readonly="readonly"
        :class="{readonly}"
    >
        <v-icon
            small
            slot="item"
            slot-scope="props"
            class="icon"
            :class="{filled: props.isFilled}"
            @click="props.click"
        >mdi-rocket</v-icon>
    </v-rating>
</template>
<script lang="ts">
import { Vue, Component, Model, Emit, Watch, Prop } from 'vue-property-decorator'

@Component
export default class Priority extends Vue {
    @Model('update', { type: Number }) priority!: number
    @Emit('update')
    update(val: number) { }
    @Prop(Boolean) readonly!: boolean

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

    created() {
        this.priorityChanged()
    }
}
</script>
<style scoped>
.icon {
    color: #c0c0c0;
}

.theme--dark .icon {
    color: #606060;
}

.filled {
    color: #3676cc !important;
}

.readonly .filled {
    color: #606060 !important;
}
.theme--dark .readonly .filled {
    color: #c0c0c0 !important;
}
</style>
