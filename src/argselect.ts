import * as vscode from 'vscode';

export function helloWorld() {
    vscode.window.showInformationMessage('Hello World 2 from argselect!');
}

const OPENING_PARENS = ["(", "[", "{"];
const CLOSING_PARENS = [")", "]", "}"];
const QUOTES = ["'", '"'];
const DELIMS = [","];
const WHITESPACE = [" ", "\t", "\n"];

type TraverseParams = {
    startIsInString?: boolean,
};
type TraverseParamsConcrete = {
    startIsInString: boolean,
};
function concretizeTraverseParams(params: TraverseParams | undefined): TraverseParamsConcrete {
    return { startIsInString: false, ...params };
}

function traverseUntilUnmatchedParen(
    text: string,
    startingOffset: number,
    dir: 1 | -1,
    paramsUninit?: TraverseParams
): number | undefined {
    const params = concretizeTraverseParams(paramsUninit);

    const openers = dir === 1 ? OPENING_PARENS : CLOSING_PARENS;
    const closers = dir === 1 ? CLOSING_PARENS : OPENING_PARENS;

    let nestedOpens: string[] = [];
    let lastNonSpace: number | undefined = undefined;

    let inString = params.startIsInString;
    const ANY_QUOTE = "aq"; // special signal, since we don't know what the quotes should be
    if (params.startIsInString) {
        nestedOpens.push(ANY_QUOTE);
    }

    let boundaryOffset: number | undefined = undefined;
    for (let i = startingOffset; i < text.length && i >= 0; i += dir) {
        const char = text[i];
        if (!inString && openers.includes(char)) {
            nestedOpens.push(char);
        } else if (!inString && closers.includes(char)) {
            const lastNestedOpen = nestedOpens.pop();
            if (lastNestedOpen === undefined) {
                boundaryOffset = i;
                break;
            } else if (openers.indexOf(lastNestedOpen) !== closers.indexOf(char)) {
                throw Error(`mismatched parens: "${lastNestedOpen}" and "${char}"`);
            }
        } else if (!inString && nestedOpens.length === 0 && DELIMS.includes(char)) {
            boundaryOffset = i;
            break;
        } else if (!inString && QUOTES.includes(char)) {
            nestedOpens.push(char);
            inString = true;
        } else if (inString && char === nestedOpens[nestedOpens.length - 1]
            || nestedOpens[nestedOpens.length - 1] === ANY_QUOTE && QUOTES.includes(char)) {
            nestedOpens.pop();
            inString = false;
        } else if (inString && char === "\n") {
            throw Error("sorry, not sure what's goin on with the strings ya got there");
        }

        if (!WHITESPACE.includes(char)) {
            lastNonSpace = i;
        }
    }

    if (boundaryOffset !== undefined) {
        if (lastNonSpace !== undefined) {
            return lastNonSpace + dir; // add dir to return offset of the space
        }

        // try backtracking to find a nonspace; might even go past starting position
        for (let i = boundaryOffset - dir; i < text.length && i >= 0; i -= dir) {
            if (!WHITESPACE.includes(text[i])) {
                return i + dir;
            }
        }
    }

    return undefined;
}

function isInString(text: string, offset: number): boolean {
    let currentQuote: string | undefined = undefined;
    for (let dir of [-1, 1]) {
        for (let i = offset; i < text.length && i >= 0; i += dir) {
            const char = text[i];
            if (currentQuote === undefined && QUOTES.includes(char)) {
                currentQuote = char;
            } else if (currentQuote === char) {
                currentQuote = undefined;
            } else if (char === "\n") {
                // assume strings don't contain raw newlines
                if (currentQuote === undefined) {
                    break;
                } else {
                    return true;
                }
            }
        }
        if (currentQuote !== undefined) {
            // got to EOF/SOF without closing the quote
            return true;
        }
    }
    return false;
}

function expandSelection(doc: vscode.TextDocument, sel: vscode.Selection): vscode.Selection {
    const text = doc.getText();
    const startOffset = doc.offsetAt(sel.active);
    const startIsInString = isInString(text, startOffset);

    const openingParenOffset = traverseUntilUnmatchedParen(text, startOffset - 1, -1, { startIsInString });
    const closingParenOffset = traverseUntilUnmatchedParen(text, startOffset, 1, { startIsInString });
    if (closingParenOffset === undefined || openingParenOffset === undefined) {
        vscode.window.showInformationMessage("ArgSelect: Couldn't find arguments to select");
        return sel; // hi jam!
    }

    const anchorPos = doc.positionAt(openingParenOffset + 1);
    const activePos = doc.positionAt(closingParenOffset);
    const newSel = new vscode.Selection(anchorPos, activePos);
    if (newSel.isReversed) {
        throw Error("oops, reversed selection");
    }
    if (!newSel.isEqual(sel)) {
        return newSel;
    }

    // TODO expand again
    throw Error("should expand again");
}

export function selectArg() {
    const editor = vscode.window.activeTextEditor;

    if (!editor) {
        return;
    }

    editor.selections = editor.selections.map(sel => expandSelection(editor.document, sel));
}