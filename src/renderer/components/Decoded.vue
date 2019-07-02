<template>
    <v-card style="border: 1px solid #eee; border-radius: 3px;">
        <v-card-title v-if="decoded" class="py-1 px-2 grey lighten-3">
            <strong>{{abi.json.type}} {{decoded.canonicalName}}</strong>
        </v-card-title>
        <v-card-text class="px-3 py-1">
            <template v-if="decoded && decoded.params.length">
                <v-data-table :headers="headers" :items="decoded.params" hide-actions>
                    <template slot="items" slot-scope="props">
                        <td>{{props.index}}</td>
                        <td>{{props.item.name}}</td>
                        <td>
                            {{props.item.type}}
                            <sup v-if="props.item.indexed">indexed</sup>
                        </td>
                        <td>{{props.item.value}}</td>
                    </template>
                    <template slot></template>
                </v-data-table>
            </template>

            <div v-else class="text-xs-center pa-3">
                <v-progress-circular v-if="abi.loading" :size="80" indeterminate color="primary">
                    <span>Loading</span>
                </v-progress-circular>
                <template v-else-if="abi.error">
                    <p class="display-1">Oops</p>
                    <Tip type="warning">{{abi.error.name}}: {{abi.error.message}}</Tip>
                    <v-btn small color="primary" @click="load">Retry</v-btn>
                </template>
                <template v-else>
                    <Tip type="warning">JSON ABI Missing</Tip>
                    <v-btn small color="primary" @click="submitAbi">Submit JSON ABI</v-btn>
                </template>
            </div>
        </v-card-text>
    </v-card>
</template>

<script lang="ts">
import { Vue, Component, Model, Prop } from 'vue-property-decorator'
import { abi } from 'thor-devkit/es6/abi'

@Component
export default class Decoded extends Vue {
    @Prop(Object) private value !: {
        data: string,
        topics?: string[]
    }

    headers = [{
        text: '#',
        sortable: false,
        align: 'left'
    }, {
        text: 'Name',
        sortable: false
    }, {
        text: 'Type',
        sortable: false
    }, {
        text: 'Data',
        sortable: false
    }]
    created() {
        this.load()
    }

    private abi = {
        json: null as abi.Function.Definition | abi.Event.Definition | null,
        loading: false,
        error: null as Error | null
    }

    get decoded() {
        const json = this.abi.json
        if (!json) {
            return null
        }

        if (json.type === 'event') {
            const ev = new abi.Event(json)
            const dec = ev.decode(this.value.data, this.value.topics!)
            return {
                params: json.inputs.map((p, i) => {
                    return {
                        name: p.name,
                        type: p.type,
                        value: dec[i],
                        indexed: p.indexed
                    }
                }),
                canonicalName: ev.canonicalName
            }

        } else {
            const fn = new abi.Function(json)
            const dec = abi.decodeParameters(json.inputs, '0x' + this.value.data.slice(10))
            return {
                params: json.inputs.map((p, i) => {
                    return {
                        name: p.name,
                        type: p.type,
                        value: dec[i]
                    }
                }),
                canonicalName: fn.canonicalName
            }
        }
    }
    submitAbi() {
        BUS.$emit('open-tab', {
            href: `https://github.com/vechain/b32/new/master/ABIs`,
            mode: 'append-active'
        })
    }
    private async load() {
        if (this.value.topics) {
            this.abi.json = JSON.parse(localStorage.getItem(this.value.topics[0]) || 'null')
        } else {
            this.abi.json = JSON.parse(localStorage.getItem(this.value.data.slice(0, 10)) || 'null')
        }

        if (this.abi.json) {
            return
        }

        if (this.abi.loading) {
            return
        }
        this.abi.json = null
        this.abi.error = null

        try {
            this.abi.loading = true
            const sig = this.value.topics ? this.value.topics[0] : this.value.data.slice(0, 10)
            const json = await queryABI(sig)
            if (json) {
                this.abi.json = json
                localStorage.setItem(sig, JSON.stringify(json))
            }
        } catch (err) {
            this.abi.error = err
        } finally {
            this.abi.loading = false
        }
    }
}

export async function queryABI(sig: string) {
    const url = `https://b32.vecha.in/q/${sig}.json`

    const resp = await fetch(url)
    if (resp.status === 404) {
        return null
    }
    if (resp.status !== 200) {
        throw new Error(`Failed to query ABI (status: ${resp.status})`)
    }

    const json = await resp.json()
    if (!Array.isArray(json) || !json[0]) {
        throw new Error('Failed to query ABI (bad response)')
    }
    return json[0]
}
</script>
