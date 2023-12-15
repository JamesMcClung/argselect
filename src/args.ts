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

    /**
     * @returns `[argIdx, offsetInArg]` where `argIdx` is which arg contains the given offset and `offsetInArg` is the offset as measured from the start of the arg. Note that offsetInArg can be negative (for the first arg) or greater than the arg length (for the last arg) when offsetInDoc does not fall in the bounds of this Args object.
     */
    getArgIdxAndOffsetInArg(offsetInDoc: number): [number, number] {
        let argStartOffset = this.startOffset + this.punctuation[0].length;
        for (let i = 0; i < this.args.length; i++) {
            const argEndOffset = argStartOffset + this.args[i].length();
            if (offsetInDoc <= argEndOffset || i === this.args.length - 1) {
                return [i, offsetInDoc - argStartOffset];
            }
            argStartOffset = argEndOffset + this.punctuation[i + 1].length;
        }
        throw Error("argselect logic error: should have returned in loop");
    }

    getOffsetOf(argIdx: number): number {
        let argOffset = this.startOffset + this.punctuation[0].length;
        for (let i = 0; i < argIdx; i++) {
            argOffset += this.args[i].length() + this.punctuation[i + 1].length;
        }
        return argOffset;
    }

    moveArg(argIdx: number, dir: -1 | 1, includeLeftSpace?: boolean, includeRightSpace?: boolean) {
        Arg.swapContent(this.args[argIdx], this.args[argIdx + dir], includeLeftSpace, includeRightSpace);
    }

    /**
     * @returns what the new selection offset bounds should be
     */
    moveArgsAt(leftOffset: number, rightOffset: number, dir: -1 | 1): [number, number] {
        let [argIdxL, offsetInArgL] = this.getArgIdxAndOffsetInArg(leftOffset);
        let [argIdxR, offsetInArgR] = this.getArgIdxAndOffsetInArg(rightOffset);

        // don't include the rightmost arg if only its left punctuation is selected
        if (offsetInArgR === 0 && argIdxR !== argIdxL) {
            argIdxR -= 1;
            offsetInArgR = this.args[argIdxR].length() + 1;
        }
        // same for leftmost arg
        if (offsetInArgL === this.args[argIdxL].length() && argIdxL !== argIdxR) {
            argIdxL += 1;
            offsetInArgL = -1;
        }

        const includeLeftSpace = offsetInArgL < 0 || this.args[argIdxL].isInLeftSpace(offsetInArgL);
        const includeRightSpace = offsetInArgR > this.args[argIdxR].length() || this.args[argIdxR].isInRightSpace(offsetInArgR - 1);

        if ((dir === 1 && argIdxR < this.args.length - 1) || (dir === -1 && argIdxL > 0)) {
            // used sometimes later
            const oldLeftSpaceLen = this.args[argIdxL].leftSpace.length;

            // do the move
            const startIdx = dir === 1 ? argIdxR : argIdxL;
            for (let i = startIdx; argIdxL <= i && i <= argIdxR; i -= dir) {
                this.moveArg(i, dir, includeLeftSpace || i !== argIdxL, includeRightSpace || i !== argIdxR);
            }

            // figure out new selection bounds
            let newLeftOffset = this.getOffsetOf(argIdxL + dir) + offsetInArgL;
            let newRightOffset = this.getOffsetOf(argIdxR + dir) + offsetInArgR;

            if (!includeLeftSpace) {
                const spaceDiff = this.args[argIdxL + dir].leftSpace.length - oldLeftSpaceLen;
                newLeftOffset += spaceDiff;
                if (argIdxL === argIdxR) {
                    newRightOffset += spaceDiff;
                }
            }

            return [newLeftOffset, newRightOffset];
        } else {
            return [leftOffset, rightOffset];
        }
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

    isInLeftSpace(offsetInArg: number): boolean {
        return offsetInArg < this.leftSpace.length;
    }

    isInContent(offsetInArg: number): boolean {
        const offsetInContent = offsetInArg - this.leftSpace.length;
        return 0 <= offsetInContent && offsetInContent < this.content.length;
    }

    isInRightSpace(offsetInArg: number): boolean {
        const offsetInRightArg = offsetInArg - this.leftSpace.length - this.content.length;
        return 0 <= offsetInRightArg && offsetInRightArg < this.rightSpace.length;
    }
}