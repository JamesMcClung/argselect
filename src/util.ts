const OPENING_PARENS = ["(", "[", "{"];
const CLOSING_PARENS = [")", "]", "}"];
const DELIMS = [","];
const WHITESPACE = [" ", "\t", "\n"];
const QUOTES = ["'", '"'];
const CHARS_NOT_IN_STRINGS = ["\n"];

export function isEscaped(text: string, offset: number): boolean {
    let escaped = false;
    for (let i = offset - 1; ; i--) {
        if (text[i] === "\\") {
            escaped = !escaped;
        } else {
            return escaped;
        }
    }
}

export function traverseUntilOutOfString(text: string, startOffset: number, dir: -1 | 1, startQuote: string): number | undefined {
    for (let i = startOffset + Math.min(dir, 0); i >= 0 && i < text.length; i += dir) {
        const char = text[i];
        if (isEscaped(text, i)) {
            continue;
        } else if (CHARS_NOT_IN_STRINGS.includes(char)) {
            // assume strings can't contain raw newlines
            break;
        } else if (char === startQuote) {
            return i + dir;
        }
    }
    return undefined;
}

function isDefinitelyNotInString(text: string, offset: number): boolean {
    // note text.length is a valid cursor offset
    return offset <= 0 || offset >= text.length || CHARS_NOT_IN_STRINGS.includes(text[offset]);
}

export function getCurrentStringType(text: string, offset: number, dir?: -1 | 1): string | undefined {
    if (dir === undefined) {
        const stringTypeLeft = getCurrentStringType(text, offset, -1);
        const stringTypeRight = getCurrentStringType(text, offset, 1);
        if (stringTypeLeft !== stringTypeRight) {
            throw Error(`argselect error: can't parse a string at offset=${offset} with leftQuote=${stringTypeLeft}, rightQuote=${stringTypeRight}`);
        }
        return stringTypeLeft;
    }

    // step 1: traverse until we find a point where we definitely aren't in a string, such as EOF
    let definitelyNotInStringOffset = offset;
    while (!isDefinitelyNotInString(text, definitelyNotInStringOffset)) {
        definitelyNotInStringOffset += dir;
    }

    // step 2: backtrack to starting position while tracking current string type
    let currentStringType: string | undefined = undefined;
    const stopOffset = offset - Math.max(0, dir);
    for (let i = definitelyNotInStringOffset + Math.min(0, -dir); i !== stopOffset; i -= dir) {
        const char = text[i];
        if (currentStringType === undefined) {
            if (QUOTES.includes(char)) {
                currentStringType = char;
            }
        } else if (isEscaped(text, i)) {
            continue;
        } else if (char === currentStringType) {
            currentStringType = undefined;
        }

        if (i < -5 || i > text.length + 5) {
            throw Error(`argselect logic error: loop idx reached ${i} and probably would have gone on forever`);
        }
    }

    return currentStringType;
}

export type TraverseParams = {
    currentStringType?: string | undefined,
    initialNestDepth?: number,
    stopAtDelims?: boolean,
    skipDelims?: number,
    includeWhitespace?: boolean,
};
type TraverseParamsConcrete = {
    currentStringType: string | undefined,
    initialNestDepth: number,
    stopAtDelims: boolean,
    skipDelims: number,
    includeWhitespace: boolean,
};
function concretizeTraverseParams(params: TraverseParams | undefined): TraverseParamsConcrete {
    return {
        currentStringType: undefined,
        initialNestDepth: 0,
        skipDelims: 0,
        stopAtDelims: true,
        includeWhitespace: false,
        ...params
    };
}

export function traverseUntilUnmatchedParen(
    text: string,
    startingOffset: number,
    dir: 1 | -1,
    paramsUninit?: TraverseParams
): number | undefined {
    const params = concretizeTraverseParams(paramsUninit);

    const openers = dir === 1 ? OPENING_PARENS : CLOSING_PARENS;
    const closers = dir === 1 ? CLOSING_PARENS : OPENING_PARENS;

    let nestDepth = params.initialNestDepth;
    let lastNonSpace: number | undefined = undefined;
    let nDelimsSkipped = 0;

    if (params.currentStringType !== undefined) {
        startingOffset = traverseUntilOutOfString(text, startingOffset, +1, params.currentStringType)!;
    }

    let boundaryOffset: number | undefined = undefined;
    for (let i = startingOffset + Math.min(dir, 0); i < text.length && i >= 0; i += dir) {
        const char = text[i];
        if (openers.includes(char)) {
            nestDepth++;
        } else if (closers.includes(char)) {
            if (nestDepth === 0) {
                boundaryOffset = i;
                break;
            }
            nestDepth--;
        } else if (params.stopAtDelims && nestDepth === 0 && DELIMS.includes(char)) {
            if (nDelimsSkipped >= params.skipDelims) {
                boundaryOffset = i;
                break;
            } else {
                nDelimsSkipped++;
            }
        } else if (QUOTES.includes(char)) {
            const stringExit = traverseUntilOutOfString(text, i + dir, dir, char);
            if (stringExit === undefined) {
                return undefined;
            }
            i = stringExit - dir;
            lastNonSpace = i;
            continue;
        }

        if (!WHITESPACE.includes(char)) {
            lastNonSpace = i;
        }
    }

    if (boundaryOffset === undefined) {
        return undefined;
    } else if (params.includeWhitespace) {
        return boundaryOffset;
    } else if (lastNonSpace !== undefined) {
        return lastNonSpace + dir; // add dir to return offset of the space
    } else {
        // try backtracking to find a nonspace; might even go past starting position
        for (let i = boundaryOffset - dir; i < text.length && i >= 0; i -= dir) {
            if (!WHITESPACE.includes(text[i])) {
                return i + dir;
            }
        }
    }
}

export function isInParens(text: string, offset: number): boolean {
    const currentStringType = getCurrentStringType(text, offset);
    const parensLeft = traverseUntilUnmatchedParen(text, offset, -1, { currentStringType, skipDelims: Infinity });
    const parensRight = traverseUntilUnmatchedParen(text, offset, 1, { currentStringType, skipDelims: Infinity });
    return parensLeft !== undefined && parensRight !== undefined;
}

export function moveCursor(text: string, cursorOffset: number, dir: -1 | 1): number | undefined {
    if (!isInParens(text, cursorOffset)) {
        return undefined;
    }

    const currentStringType = getCurrentStringType(text, cursorOffset);
    let endOffset = traverseUntilUnmatchedParen(text, cursorOffset, dir, { currentStringType })! - Math.min(0, dir);

    if (dir === 1 && endOffset <= cursorOffset || dir === -1 && endOffset >= cursorOffset) {
        endOffset = traverseUntilUnmatchedParen(text, cursorOffset, dir, { skipDelims: 1, currentStringType })! - Math.min(0, dir);
    }

    return endOffset;
}

export function selectAtCursor(text: string, cursorOffset: number, traverseParams: TraverseParams = {}): [number, number] | undefined {
    let selStartOffset = traverseUntilUnmatchedParen(text, cursorOffset, -1, traverseParams);
    let selEndOffset = traverseUntilUnmatchedParen(text, cursorOffset, 1, traverseParams);
    if (selEndOffset === undefined || selStartOffset === undefined) {
        return undefined; // hi jam!
    }

    // when we include whitespace, it's assumed we also want to include a delim on one side (but not both sides)
    if (traverseParams.includeWhitespace) {
        if (DELIMS.includes(text[selEndOffset])) {
            selEndOffset += 1;
        } else if (DELIMS.includes(text[selStartOffset])) {
            selStartOffset -= 1;
        }
    }
    selStartOffset += 1; // want cursor to be placed to the *right* of the left boundary
    // min/max business is to handle case when selecting pure whitespace
    return [Math.min(selStartOffset, selEndOffset), Math.max(selStartOffset, selEndOffset)];
}
