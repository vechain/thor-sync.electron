import { Vue } from 'vue-property-decorator'

// declare vue life-cycle hooks
declare module 'vue/types/vue' {
    export interface Vue {
        beforeCreate(): void
        created(): void
        beforeMount(): void
        mounted(): void
        beforeUpdate(): void
        updated(): void
        activated(): void
        deactivated(): void
        beforeDestroy(): void
        destroyed(): void
    }
}
