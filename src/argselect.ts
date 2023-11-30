import * as vscode from 'vscode';

export function helloWorld() {
    vscode.window.showInformationMessage('Hello World 2 from argselect!');
}

const OPENING_PARENS = ["(", "[", "{"];
const CLOSING_PARENS = [")", "]", "}"];
const QUOTES = ["'", '"'];
const DELIMS = [","];
const WHITESPACE = [" ", "\t", "\n"];


function traverseUntilUnmatchedParen(text: string, startingOffset: number, dir: 1 | -1, inString: boolean = false): number | undefined {
    const openers = dir === 1 ? OPENING_PARENS : CLOSING_PARENS;
    const closers = dir === 1 ? CLOSING_PARENS : OPENING_PARENS;

    let nestedOpens: string[] = [];
    let lastNonSpace: number | undefined = undefined;

    const startedInString = inString;
    const ANY_QUOTE = "aq"; // special signal, since we don't know what the quotes should be
    if (startedInString) {
        nestedOpens.push(ANY_QUOTE);
    }

    for (let i = startingOffset; i < text.length && i >= 0; i += dir) {
        const char = text[i];
        if (!inString && openers.includes(char)) {
            nestedOpens.push(char);
        } else if (!inString && closers.includes(char)) {
            const lastNestedOpen = nestedOpens.pop();
            if (lastNestedOpen === undefined) {
                return i;
            } else if (openers.indexOf(lastNestedOpen) !== closers.indexOf(char)) {
                throw Error(`mismatched parens: "${lastNestedOpen}" and "${char}"`);
            }
        } else if (!inString && nestedOpens.length === 0 && DELIMS.includes(char)) {
            if (lastNonSpace === undefined) {
                // try searching the other way for a nonspace
                for (let j = i - dir; j < text.length && j >= 0; j -= dir) {
                    if (!WHITESPACE.includes(text[j])) {
                        return j + dir;
                    }
                }
                throw Error(`this comma confuses me`);
            } else {
                return lastNonSpace + dir;
            }
        } else if (!inString && QUOTES.includes(char)) {
            nestedOpens.push(char);
            inString = true;
        } else if (inString && char === nestedOpens[nestedOpens.length - 1]
            || nestedOpens[nestedOpens.length - 1] === ANY_QUOTE && QUOTES.includes(char)) {
            nestedOpens.pop();
            inString = false;
        } else if (inString && char === "\n") {
            // assume raw newlines aren't allowed, so we must have started in a string
            if (!startedInString) {
                // nothing to do but restart...
                return traverseUntilUnmatchedParen(text, startingOffset, dir, true);
            } else {
                // ...unless we already tried that, in which case, give up
                throw Error("sorry, not sure what's goin on with the strings ya got there");
            }
        }

        if (!WHITESPACE.includes(char)) {
            lastNonSpace = i;
        }
    }
    if (inString) {
        // same deal as before, except it's EOF/SOF instead of newlines
        if (!startedInString) {
            return traverseUntilUnmatchedParen(text, startingOffset, dir, true);
        } else {
            throw Error("sorry, not sure what's goin on with the strings ya got there");
        }
    }
    return undefined;
}

function expandSelection(doc: vscode.TextDocument, sel: vscode.Selection): vscode.Selection {
    const text = doc.getText();
    const startOffset = doc.offsetAt(sel.start);

    const openingParenOffset = traverseUntilUnmatchedParen(text, startOffset - 1, -1);
    if (openingParenOffset === undefined) {
        return sel;
    }

    const closingParenOffset = traverseUntilUnmatchedParen(text, startOffset, 1);
    if (closingParenOffset === undefined) {
        return sel; // hi jam!
    }

    const anchorPos = doc.positionAt(openingParenOffset + 1);
    const activePos = doc.positionAt(closingParenOffset);
    return new vscode.Selection(anchorPos, activePos);
}

export function selectArg() {
    const editor = vscode.window.activeTextEditor;

    if (!editor) {
        return;
    }

    editor.selections = editor.selections.map(sel => expandSelection(editor.document, sel));
}