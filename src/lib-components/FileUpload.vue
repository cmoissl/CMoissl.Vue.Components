<template>

    <div style="width: 100%">
        <div id="app" style="width: 100%">
            <div class="p-12 bg-gray-100 border border-gray-300" @dragover="dragover" @dragleave="dragleave" @drop="drop">
                <input type="file" multiple name="fields[assetsFieldHandle][]" id="assetsFieldHandle"
                       class="w-px h-px opacity-0 overflow-hidden absolute" @change="onChange" ref="file" accept=".pdf,.jpg,.jpeg,.png" />

                <label for="assetsFieldHandle" class="block cursor-pointer">
                    <div>
                        Fügen Sie Ihr aktuells Profil und sonstige Dateien per Drag & Drop hinzu oder klicken Sie <span class="underline" style="cursor: pointer">hier</span>.
                    </div>
                    <div>
                        (
                        <span>Maximal erlaubte Größe: {{fileSizeToHumanReadable(totalMaxBytes)}}, </span>
                        <span>
                            Erlaubte Dateitypen:
                            <span v-for="type in allowedFileTypes" :key="type">
                                {{type}}<span v-if="allowedFileTypes[allowedFileTypes.length-1]!= type">, </span>
                            </span>
                        </span>
                        )
                    </div>
                </label>
                <ul class="mt-4" v-if="filelist.length" v-cloak>
                    <v-chip v-for="file in filelist" v-bind:key="file"
                            class="ma-2"
                            close
                            @click:close="remove(filelist.indexOf(file))">
                        {{ file.name }} ({{fileSizeToHumanReadable(file.size)}})
                    </v-chip>

                </ul>
            </div>

            <v-progress-linear v-if="totalMaxBytes" :value="usedBytes/totalMaxBytes*100"></v-progress-linear>
        </div>
        <v-alert color="red"
                 dismissible
                 type="error"
                 v-if="fileErrors.length">
            <div v-for="error in fileErrors" :key="error">
                {{ error }}
            </div>
            <div v-for="error in errors" :key="error">
                {{ error}}
            </div>

        </v-alert>
        <v-text-field ref="editor"
                      style="display:none"
                      v-model.trim="content"
                      :rules="rules" />

        <v-alert color="red"
                 dismissible
                 type="error" v-if="editorRef && editorRef.hasState">
            <div v-for="error in this.editorRef.errorBucket" :key="error">
                {{ error }}
            </div>
        </v-alert>
    </div>

</template>

<script lang="ts">
    import { Component, Prop, Vue, Ref } from 'vue-property-decorator';
    import { Helpers } from '@/services/Helpers.ts';
    import { FileRuleChecker } from '@/services/FileRuleChecker.ts';

    @Component({ components: {} })
    export default class FileUpload extends Vue {
        @Prop() private errors!: string[];
        @Prop() private value!: File[];
        @Prop() private totalMaxBytes!: number;
        @Prop() private allowedFileTypes!: string[];
        @Prop() private validator!: any;
        @Ref() provider: any;
        private content = "";
        usedBytes = 0;
        editorRef = {};
        @Ref() editor: any;
        $refs!: {
            file: HTMLInputElement;
        }
        filelist: File[] = [];


        rules = [
            (v: string) => this.validateFile() || 'At least one file has to be defined!'
        ];



        validateFile(): boolean {
            console.log("validation called");

            return !!this.filelist.length && !this.fileErrors.length;

        }

        fileSizeToHumanReadable(size: number): string {
            return Helpers.formatBytes(size);
        }

        fileErrors: string[] = [];

        async onChange(e: any) {

            let fileArray = Array.prototype.slice.call(this.$refs.file.files);// [...this.$refs.file.files]
            console.log("onchange:", fileArray, this.$refs.file.files);
            //var fileArray =  Array.from(this.$refs.file.files);
            // var arr = [...fileArray];
            //await this.validator.validate(e);

            const fileChecker = new FileRuleChecker(this.filelist, this.totalMaxBytes, this.allowedFileTypes);

            const checkResults = fileChecker.check(fileArray);
            fileArray = checkResults.filter(o => !o.rejected).map(o => o.file);

            this.fileErrors = checkResults.filter(o => o.rejected).map(o => {
                if (o.rejectedBecauseMaxFileSize) {
                    return `Datei übersteigt maximale Größe (${o.file.name}).`;
                }
                if (o.rejectedBecauseSuffix) {
                    return `Datei Typ ist nicht erlaubt (${o.file.name}).`
                }
                if (o.rejectedBecauseDoubleFile) {
                    return `Datei ist bereits enthalten (${o.file.name}).`
                }
                return 'N/A';
            });
            this.filelist = fileArray; // arr as Array<File>;
            this.update();


        }

        validate(): boolean {
            console.log("Fileupload validation");
            if (!this.filelist.length) {
                this.fileErrors = ["Keine Datei hinzugefügt"]
                return false;
            }
            return !!this.fileErrors.length;
        }

        mounted() {

            this.editorRef = this.editor;
        }

        update() {
            // this uses non public api of vuetify and should be exchanged by a more
            // stable solution (e.g. triggering an event that is catched by the parent component
            // which contains v-form and invokes the validate method on it )
            this.editor.validate(true);
            this.usedBytes = this.filelist.map(o => o.size).reduce((ty, u) => ty + u, 0);

            this.$emit('change', this.filelist);
        }
        remove(i: number) {
            this.filelist.splice(i, 1);
            this.update();
        }
        dragover(event: DragEvent) {
            event.preventDefault();
            // Add some visual fluff to show the user can drop its files
            const target = event.currentTarget as HTMLElement;

            if (!target.classList.contains('bg-green-300')) {
                target.classList.remove('bg-gray-100');
                target.classList.add('bg-green-300');
            }
        }
        dragleave(event: DragEvent) {
            const target = event.currentTarget as HTMLElement;
            // Clean up
            target.classList.add('bg-gray-100');
            target.classList.remove('bg-green-300');
        }
        drop(event: DragEvent) {
            const target = event.currentTarget as HTMLElement;
            const file = this.$refs.file;

            if (!event || !file) {
                return;
            }
            event.preventDefault();


            file.files = event.dataTransfer!.files!;
            console.log("Files:", file.files);
            this.onChange(null); // Trigger the onChange event manually
            // Clean up
            target.classList.add('bg-gray-100');
            target.classList.remove('bg-green-300');
        }
    }
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
    /*@import "https://cdnjs.cloudflare.com/ajax/libs/tailwindcss/1.1.4/tailwind.min.css";*/

    [v-cloak] {
        display: none;
    }

    .p-12 {
        padding: 3rem;
    }

    .border {
        border-width: 1px;
    }

    .border-gray-300 {
        border-color: #e2e8f0;
    }

    .bg-gray-100 {
        background-color: #f7fafc;
    }

    *, ::after, ::before {
        border-width: 0;
        border-style: solid;
        border-color: #e2e8f0;
    }

    .underline {
        text-decoration: underline;
    }


    .mt-4 {
        margin-top: 1rem;
    }

    ol, ul {
        list-style: none;
        margin: 0;
        padding: 0;
    }

    .text-sm {
        font-size: .875rem;
    }

    .p-1 {
        padding: .25rem;
    }

    .w-px {
        width: 1px;
    }

    .absolute {
        position: absolute;
    }

    .overflow-hidden {
        overflow: hidden;
    }

    .opacity-0 {
        opacity: 0;
    }

    .h-px {
        height: 1px;
    }

    button, input, optgroup, select, textarea {
        padding: 0;
        line-height: inherit;
        color: inherit;
    }

    button, input {
        overflow: visible;
    }

    button, input, optgroup, select, textarea {
        font-family: inherit;
        font-size: 100%;
        line-height: 1.15;
        margin: 0;
    }
</style>
