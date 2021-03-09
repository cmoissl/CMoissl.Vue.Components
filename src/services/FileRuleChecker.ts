export class CheckResult {

    constructor(
        public file: File,
        public rejectedBecauseMaxFileSize: boolean,
        public rejectedBecauseSuffix: boolean,
        public rejectedBecauseDoubleFile: boolean) {

    }
    get rejected(): boolean {
        return this.rejectedBecauseDoubleFile ||
            this.rejectedBecauseSuffix ||
            this.rejectedBecauseMaxFileSize;
    }
}
export class FileRuleChecker {

    totalBytesUsed = 0;

    constructor(private existingFiles: File[],
        private totalBytesAllowed: number,
        private allowedSuffixes: string[]) {

        this.totalBytesUsed = this.calcSize(existingFiles);

    }

    getSuffix(fileName: string): string {
        const ext = fileName.substr(fileName.lastIndexOf('.') + 1);
        return ext;
    }

    calcSize(files: File[]) {
        const ret = files.map(o => o.size).reduce((ty, u) => ty + u, 0);
        return ret;
    }

    check(newFiles: File[]): CheckResult[] {
        let newTotalFileSize = 0;
        const allFiles = [...this.existingFiles, ...newFiles];
        const fileCheck = allFiles.map((o, pos) => {

            newTotalFileSize = newTotalFileSize + o.size;
            const rejectedBecauseMaxFileSize: boolean = this.totalBytesAllowed != 0 && newTotalFileSize > this.totalBytesAllowed;
            const rejectedBecauseDoubleFile = !(allFiles.findIndex((x: File) => x.name === o.name) === pos);
            const rejectedBecauseSuffix = !(this.allowedSuffixes.indexOf(this.getSuffix(o.name)) !== -1);

            const ret = new CheckResult(o, rejectedBecauseMaxFileSize,
                rejectedBecauseSuffix,
                rejectedBecauseDoubleFile);
            return ret;

        });
        return fileCheck;

    }


}