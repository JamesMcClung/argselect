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
    initialNestDepth?: number,
    stopAtDelims?: boolean,
    includeWhitespace?: boolean,
};
type TraverseParamsConcrete = {
    startIsInString: boolean,
    initialNestDepth: number,
    stopAtDelims: boolean,
    includeWhitespace: boolean,
};
function concretizeTraverseParams(params: TraverseParams | undefined): TraverseParamsConcrete {
    return {
        startIsInString: false,
        initialNestDepth: 0,
        stopAtDelims: true,
        includeWhitespace: false,
        ...params
    };
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

    let nestDepth = params.initialNestDepth;
    let lastNonSpace: number | undefined = undefined;

    const ANY_QUOTE = "aq"; // special signal, since we don't know what the quotes should be
    let currentQuote: string | undefined = params.startIsInString ? ANY_QUOTE : undefined;
    if (params.startIsInString) {
        nestDepth++;
    }

    let boundaryOffset: number | undefined = undefined;
    for (let i = startingOffset; i < text.length && i >= 0; i += dir) {
        const char = text[i];
        if (currentQuote === undefined && openers.includes(char)) {
            nestDepth++;
        } else if (currentQuote === undefined && closers.includes(char)) {
            if (nestDepth === 0) {
                boundaryOffset = i;
                break;
            }
            nestDepth--;
        } else if (params.stopAtDelims && currentQuote === undefined && nestDepth === 0 && DELIMS.includes(char)) {
            boundaryOffset = i;
            break;
        } else if (currentQuote === undefined && QUOTES.includes(char)) {
            nestDepth++;
            currentQuote = char;
        } else if (char === currentQuote || currentQuote === ANY_QUOTE && QUOTES.includes(char)) {
            nestDepth--;
            currentQuote = undefined;
        } else if (currentQuote !== undefined && char === "\n") {
            throw Error("sorry, not sure what's goin on with the strings ya got there");
        }

        if (!WHITESPACE.includes(char)) {
            lastNonSpace = i;
        }
    }

    if (boundaryOffset !== undefined) {
        if (params.includeWhitespace) {
            return boundaryOffset;
        }

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

function expandSelection(doc: vscode.TextDocument, sel: vscode.Selection, traverseParams: TraverseParams = {}): vscode.Selection | undefined {
    const text = doc.getText();
    const startOffset = doc.offsetAt(sel.active);

    const openingParenOffset = traverseUntilUnmatchedParen(text, startOffset - 1, -1, traverseParams);
    const closingParenOffset = traverseUntilUnmatchedParen(text, startOffset, 1, traverseParams);
    if (closingParenOffset === undefined || openingParenOffset === undefined) {
        return undefined; // hi jam!
    }

    const anchorPos = doc.positionAt(openingParenOffset + 1);
    const activePos = doc.positionAt(closingParenOffset);
    const newSel = new vscode.Selection(anchorPos, activePos);
    if (newSel.isReversed) {
        throw Error("oops, reversed selection");
    }
    return newSel;
}

function expandSelectionDispatcher(doc: vscode.TextDocument, sel: vscode.Selection): vscode.Selection {
    const startIsInString = isInString(doc.getText(), doc.offsetAt(sel.active));
    const paramAttempts: TraverseParams[] = [
        { startIsInString },
        { startIsInString, includeWhitespace: true },
        { startIsInString, stopAtDelims: false },
        { startIsInString, initialNestDepth: 1 },
    ];

    let maybeNewSel: vscode.Selection | undefined;
    for (let paramAttempt of paramAttempts) {
        maybeNewSel = expandSelection(doc, sel, paramAttempt);
        if (maybeNewSel === undefined) {
            vscode.window.showInformationMessage("ArgSelect: Nothing to expand selection to");
            return sel;
        }
        if (!sel.contains(maybeNewSel) && (maybeNewSel.contains(sel) || sel.isEmpty)) {
            return maybeNewSel;
        }
    }

    vscode.window.showInformationMessage("ArgSelect: Couldn't expand selection");
    return sel;
}

export function selectArg() {
    const editor = vscode.window.activeTextEditor;

    if (!editor) {
        return;
    }

    editor.selections = editor.selections.map(sel => expandSelectionDispatcher(editor.document, sel));
}