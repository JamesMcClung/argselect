import * as util from './util';

export class Args {
    punctuation: string[];
    contents: string[];

    constructor(text: string, interiorOffset: number) {
        const currentStringType = util.getCurrentStringType(text, interiorOffset);
        const params = { includeWhitespace: true, skipDelims: Infinity, currentStringType };

        const leftParenOffset = util.traverseUntilUnmatchedParen(text, interiorOffset, -1, params);
        const rightParenOffset = util.traverseUntilUnmatchedParen(text, interiorOffset, 1, params);
        if (leftParenOffset === undefined || rightParenOffset === undefined) {
            throw Error("internal argselect error: invalid position to make Args at");
        }

        const sepEndIdxs = [rightParenOffset + 1]; // exclusive
        for (let i = rightParenOffset; ;) {
            i = util.moveCursor(text, i, -1)!;
            if (i === sepEndIdxs[sepEndIdxs.length - 1]) {
                break;
            }
            sepEndIdxs.push(i);
        }
        sepEndIdxs.reverse();

        const sepStartIdxs = [leftParenOffset]; // inclusive
        for (let i = leftParenOffset + 1; ;) {
            i = util.moveCursor(text, i, 1)!;
            if (i === sepStartIdxs[sepStartIdxs.length - 1]) {
                break;
            }
            sepStartIdxs.push(i);
        }

        this.punctuation = [];
        this.contents = [];
        for (let i = 0; i < sepStartIdxs.length; i++) {
            this.punctuation.push(text.slice(sepStartIdxs[i], sepEndIdxs[i]));
            if (i > 0) {
                this.contents.push(text.slice(sepEndIdxs[i - 1], sepStartIdxs[i]));
            }
        }
    }
}