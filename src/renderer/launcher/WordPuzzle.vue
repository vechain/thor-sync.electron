<template>
    <div>
        <v-layout row wrap>
            <v-flex xs2 v-for="word in shuffledWords" :key="word.value">
                <v-btn color="info" depressed round :disabled="word.picked" @click="pickWord(word)">
                    {{word.value}}
                </v-btn>
            </v-flex>
        </v-layout>
        <v-divider class="my-2"></v-divider>
        <v-layout row wrap>
            <v-flex xs2 v-for="word in pickedWords" :key="word.value">
                <v-btn depressed round @click="unpickWord(word)" :color="verifyWord(word) ? 'success': 'error'">
                    <v-spacer />
                    {{word.value}}
                    <v-spacer />
                    <v-icon small class="caption">close</v-icon>
                </v-btn>
            </v-flex>
        </v-layout>
    </div>
</template>
<script lang="ts">
import { Vue, Component, Model, Prop, Watch } from 'vue-property-decorator'

@Component
export default class WordPuzzle extends Vue {
    @Prop(Array) words!: string[]

    @Model('change') value !: boolean

    @Watch('value')
    enforceValue() {
        const newValue = this.resolved
        if (newValue !== this.value) {
            this.$emit('change', newValue)
        }
    }
    @Watch('words')
    reset() {
        this.pickedWords = []
        this.enforceValue()
    }

    created() {
        this.enforceValue()
    }

    pickedWords = [] as Word[]

    get safeWords() {
        return Array.isArray(this.words) ? this.words : []
    }

    get shuffledWords() {
        return shuffle(this.safeWords.map<Word>(w => ({ value: w, picked: false })))
    }

    pickWord(word: Word) {
        word.picked = true
        this.pickedWords.push(word)

        this.enforceValue()
    }

    unpickWord(word: Word) {
        word.picked = false
        this.pickedWords = this.pickedWords.filter(w => w.picked)

        this.enforceValue()
    }

    verifyWord(word: Word) {
        return this.pickedWords.indexOf(word) === this.safeWords.indexOf(word.value)
    }

    get resolved() {
        return this.pickedWords.length === this.safeWords.length &&
            this.pickedWords.every((w, i) => w.value === this.safeWords[i])
    }
}


type Word = {
    value: string
    picked: boolean
}


/**
 * Shuffles array in place.
 * @param {Array} a items An array containing the items.
 */
function shuffle<T>(a: T[]) {
    var j, x, i;
    for (i = a.length - 1; i > 0; i--) {
        j = Math.floor(Math.random() * (i + 1));
        x = a[i];
        a[i] = a[j];
        a[j] = x;
    }
    return a;
}
</script>
