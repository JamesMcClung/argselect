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
        } else if (char === "\n") {
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
            throw Error(`idk what's up with this string: left=${stringTypeLeft}, right=${stringTypeRight}`);
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
            throw Error(`loop: ${i}`);
        }
    }

    return currentStringType;
}