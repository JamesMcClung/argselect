import * as util from './util';

export class Args {
    punctuation: string[];
    args: Arg[];
    startOffset: number;
    endOffset: number;

    constructor(text: string, interiorOffset: number) {
        const currentStringType = util.getCurrentStringType(text, interiorOffset);
        const params = { includeWhitespace: true, skipDelims: Infinity, currentStringType };

        const leftParenOffset = util.traverseUntilUnmatchedParen(text, interiorOffset, -1, params);
        const rightParenOffset = util.traverseUntilUnmatchedParen(text, interiorOffset, 1, params);
        if (leftParenOffset === undefined || rightParenOffset === undefined) {
            throw Error("internal argselect error: invalid position to make Args at");
        }
        this.startOffset = leftParenOffset;
        this.endOffset = rightParenOffset;

        this.punctuation = [text[leftParenOffset]];
        this.args = [];
        for (let argStartOffset = leftParenOffset + 1; argStartOffset < rightParenOffset;) {
            let argEndOffset = util.traverseUntilUnmatchedParen(text, argStartOffset, 1, { includeWhitespace: true })!;
            this.args.push(new Arg(text.slice(argStartOffset, argEndOffset)));
            this.punctuation.push(text[argEndOffset]);
            argStartOffset = argEndOffset + 1;
        }
    }

    getArgIdx(offsetInDoc: number): number | undefined {
        let argStartOffset = this.startOffset + this.punctuation[0].length;
        for (let i = 0; i < this.args.length; i++) {
            const argEndOffset = argStartOffset + this.args[i].length();
            if (argStartOffset <= offsetInDoc && offsetInDoc <= argEndOffset) {
                return i;
            }
            argStartOffset = argEndOffset + this.punctuation[i + 1].length;
        }
        return undefined;
    }

    /**
     * @returns the deltaOffset of the moved argument, so selections can be updated accordingly
     */
    moveArgAt(offsetInDoc: number, dir: -1 | 1, includeLeftSpace?: boolean, includeRightSpace?: boolean): number {
        const argIdx1 = this.getArgIdx(offsetInDoc);
        if (argIdx1 === undefined) {
            throw Error("internal argselect error: offset out of bounds");
        }
        const argIdx2 = argIdx1 + dir;
        if (argIdx2 < 0 || argIdx2 >= this.args.length) {
            return 0;
        }

        const arg1 = this.args[argIdx1];
        const arg2 = this.args[argIdx2];

        const deltaOffsetFromPunctuation = this.punctuation[dir === 1 ? argIdx2 : argIdx1].length;

        let deltaOffset;
        // TODO make this not so brute force
        if (includeLeftSpace && includeRightSpace) {
            deltaOffset = arg2.length() + deltaOffsetFromPunctuation;
        } else if (includeLeftSpace && !includeRightSpace) {
            if (dir === 1) {
                deltaOffset = arg1.rightSpace.length + deltaOffsetFromPunctuation + arg2.leftSpace.length + arg2.content.length;
            } else {
                deltaOffset = arg2.leftSpace.length + arg2.content.length + arg2.rightSpace.length + deltaOffsetFromPunctuation;
            }
        } else if (!includeLeftSpace && includeRightSpace) {
            if (dir === 1) {
                deltaOffset = deltaOffsetFromPunctuation + arg2.leftSpace.length + arg2.content.length + arg2.rightSpace.length;
            } else {
                deltaOffset = arg2.content.length + arg2.rightSpace.length + deltaOffsetFromPunctuation + arg1.leftSpace.length;
            }
        } else {
            if (dir === 1) {
                deltaOffset = arg1.rightSpace.length + deltaOffsetFromPunctuation + arg2.leftSpace.length + arg2.content.length;
            } else {
                deltaOffset = arg2.content.length + arg2.rightSpace.length + deltaOffsetFromPunctuation + arg1.leftSpace.length;
            }
        }

        Arg.swapContent(arg1, arg2, includeLeftSpace, includeRightSpace);

        return dir * deltaOffset;
    }

    toString(): string {
        let s = this.punctuation[0];
        for (let i = 0; i < this.args.length; i++) {
            s += this.args[i].toString();
            s += this.punctuation[i + 1];
        }
        return s;
    }

    getStartOffset(): number {
        return this.startOffset;
    }

    getEndOffset(): number {
        return this.endOffset;
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

    static swapContent(arg1: Arg, arg2: Arg, includeLeftSpace?: boolean, includeRightSpace?: boolean) {
        [arg1.content, arg2.content] = [arg2.content, arg1.content];
        if (includeLeftSpace) {
            [arg1.leftSpace, arg2.leftSpace] = [arg2.leftSpace, arg1.leftSpace];
        }
        if (includeRightSpace) {
            [arg1.rightSpace, arg2.rightSpace] = [arg2.rightSpace, arg1.rightSpace];
        }
    }

    equals(other: Arg): boolean {
        return this.leftSpace === other.leftSpace && this.content === other.content && this.rightSpace === other.rightSpace;
    }
}