<template>
    <div>
        <v-toolbar flat color="white">
            <v-toolbar-title>Clause</v-toolbar-title>
            <v-divider class="mx-2" inset vertical></v-divider>
            <v-spacer></v-spacer>
            <v-dialog v-model="dialog" max-width="500px">
                <v-btn slot="activator" color="primary" dark class="mb-2">Add Clause</v-btn>
                <v-card>
                    <v-card-title>
                        <span class="headline">{{formTitle}}</span>
                    </v-card-title>

                    <v-card-text>
                        <v-container grid-list-md>
                            <v-layout wrap>
                                <v-flex sm12>
                                    <v-text-field v-model="editedItem.to" label="To"></v-text-field>
                                </v-flex>
                                <v-flex sm12>
                                    <v-text-field v-model="editedItem.value" label="value"></v-text-field>
                                </v-flex>
                                <v-flex sm12>
                                    <v-text-field v-model="editedItem.data" label="Data"></v-text-field>
                                </v-flex>
                            </v-layout>
                        </v-container>
                    </v-card-text>

                    <v-card-actions>
                        <v-spacer></v-spacer>
                        <v-btn color="blue darken-1" flat @click.native="close">Cancel</v-btn>
                        <v-btn color="blue darken-1" flat @click.native="save">Save</v-btn>
                    </v-card-actions>
                </v-card>
            </v-dialog>
        </v-toolbar>
        <v-data-table :headers="headers" :items="clauses" hide-actions class="elevation-1">
            <template slot="items" slot-scope="props">
                <td class="text-xs-left">{{ props.item.to }}</td>
                <td class="text-xs-left">{{ props.item.value }}</td>
                <td class="text-xs-left">{{ props.item.data }}</td>
                <td class="justify-center layout px-0">
                    <v-icon class="mr-2" @click="editItem(props.item)">
                        edit
                    </v-icon>
                    <v-icon @click="deleteItem(props.item)">
                        delete
                    </v-icon>
                </td>
            </template>
        </v-data-table>
        <div class="text-xs-center pt-2">
            <v-btn color="primary" @click.native="sign">Sign</v-btn>
        </div>
        <v-container fluid grid-list-md>
            <v-layout row wrap>
                <v-flex xs6>
                    <v-textarea outline label="rlp code" :value="signCode"></v-textarea>
                </v-flex>
                <v-flex xs6>
                    <v-btn color="primary" @click.native="sendTx">Send</v-btn>
                </v-flex>
                <v-flex xs6>
                    <pre>{{response}}</pre>
                </v-flex>
            </v-layout>
        </v-container>
    </div>
</template>
<script lang="ts">
import { Vue, Component } from 'vue-property-decorator'
import { connect } from 'tls'
@Component
export default class ClauseSign extends Vue {
    public editedIndex: number = -1
    public editedItem: Connex.Thor.Clause = {
        to: '',
        data: '',
        value: ''
    }
    public defaultItem: Connex.Thor.Clause = {
        to: '',
        data: '',
        value: ''
    }
    public dialog: boolean = false

    public signCode: string = ''
    public response: object = {}

    public headers: any[] = [
        { text: 'To', align: 'left', sortable: false, value: 'address' },
        { text: 'Value', value: 'value', align: 'left', sortable: false },
        { text: 'Data', value: 'data', align: 'left', sortable: false },
        { text: 'Actions', value: 'name', align: 'left', sortable: false }
    ]

    public clauses: Connex.Thor.Clause[] = []

    public close() {
        this.dialog = false
        setTimeout(() => {
            this.editedItem = Object.assign({}, this.defaultItem)
            this.editedIndex = -1
        }, 300)
    }

    public editItem(item: Connex.Thor.Clause) {
        this.editedIndex = this.clauses.indexOf(item)
        this.editedItem = Object.assign({}, item)
        this.dialog = true
    }

    public deleteItem(item: Connex.Thor.Clause) {
        const index = this.clauses.indexOf(item)
        confirm('Are you sure you want to delete this item?') &&
            this.clauses.splice(index, 1)
    }

    get formTitle() {
        return this.editedIndex === -1 ? 'New Item' : 'Edit Item'
    }

    public sign() {
        let cnx = window.connex
        let clauses = this.clauses.map(item => {
            return {
                to: item.to,
                value: '0x' + parseInt(item.value).toString(16),
                data: '0x' + item.data
            }
        })
        cnx.vendor.sign('tx', clauses).then(result => {
            this.signCode = result.txId
        })
    }

    public sendTx() {
        // connex.thor
        //     .commit(this.signCode)
        //     .then(r => {
        //         this.response = r
        //         // console.log(r)
        //     })
        //     .catch(e => {
        //         console.error(e)
        //     })
    }

    public save() {
        if (this.editedIndex > -1) {
            Object.assign(this.clauses[this.editedIndex], this.editedItem)
        } else {
            this.clauses.push(this.editedItem)
        }
        this.close()
    }
}
</script>
