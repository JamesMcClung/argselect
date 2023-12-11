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

export class Arg {
    leftSpace: string;
    content: string;
    rightSpace: string;

    constructor(contents: string) {
        const match = contents.match(/^(\s*)(.*?)(\s*)$/)!;
        this.leftSpace = match[1];
        this.content = match[2];
        this.rightSpace = match[3];
    }

    length(): number {
        return this.leftSpace.length + this.content.length + this.rightSpace.length;
    }

    toString(): string {
        return this.leftSpace + this.content + this.rightSpace;
    }

    static swapContent(arg1: Arg, arg2: Arg) {
        [arg1.content, arg2.content] = [arg2.content, arg1.content];
    }

    equals(other: Arg): boolean {
        return this.leftSpace === other.leftSpace && this.content === other.content && this.rightSpace === other.rightSpace;
    }
}