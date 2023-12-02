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
