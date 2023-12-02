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