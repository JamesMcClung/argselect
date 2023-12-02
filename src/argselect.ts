import * as vscode from 'vscode';
import * as util from './util';

export function helloWorld() {
    vscode.window.showInformationMessage('Hello World 2 from argselect!');
}

const OPENING_PARENS = ["(", "[", "{"];
const CLOSING_PARENS = [")", "]", "}"];
const QUOTES = ["'", '"'];
const DELIMS = [","];
const WHITESPACE = [" ", "\t", "\n"];

type TraverseParams = {
    currentStringType?: string | undefined,
    initialNestDepth?: number,
    stopAtDelims?: boolean,
    includeWhitespace?: boolean,
};
type TraverseParamsConcrete = {
    currentStringType: string | undefined,
    initialNestDepth: number,
    stopAtDelims: boolean,
    includeWhitespace: boolean,
};
function concretizeTraverseParams(params: TraverseParams | undefined): TraverseParamsConcrete {
    return {
        currentStringType: undefined,
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

    if (params.currentStringType !== undefined) {
        startingOffset = util.traverseUntilOutOfString(text, startingOffset, dir, params.currentStringType)!;
    }

    let boundaryOffset: number | undefined = undefined;
    for (let i = startingOffset; i < text.length && i >= 0; i += dir) {
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
            boundaryOffset = i;
            break;
        } else if (QUOTES.includes(char)) {
            const stringExit = util.traverseUntilOutOfString(text, i + dir, dir, char);
            if (stringExit === undefined) {
                throw Error("couldn't figure out this string");
            }
            i = stringExit;
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

function expandSelection(doc: vscode.TextDocument, sel: vscode.Selection, traverseParams: TraverseParams = {}): vscode.Selection | undefined {
    const text = doc.getText();
    const startOffset = doc.offsetAt(sel.active);

    let openingParenOffset = traverseUntilUnmatchedParen(text, startOffset - 1, -1, traverseParams);
    let closingParenOffset = traverseUntilUnmatchedParen(text, startOffset, 1, traverseParams);
    if (closingParenOffset === undefined || openingParenOffset === undefined) {
        return undefined; // hi jam!
    }

    if (traverseParams.includeWhitespace) {
        if (DELIMS.includes(text[closingParenOffset])) {
            closingParenOffset += 1;
        } else if (DELIMS.includes(text[openingParenOffset])) {
            openingParenOffset -= 1;
        }
    }

    const anchorPos = doc.positionAt(openingParenOffset + 1);
    const activePos = doc.positionAt(closingParenOffset);
    const newSel = new vscode.Selection(anchorPos, activePos);
    if (newSel.isReversed) {
        // happens when selecting pure whitespace as an arg
        return new vscode.Selection(activePos, anchorPos);
    }
    return newSel;
}

function expandSelectionDispatcher(doc: vscode.TextDocument, sel: vscode.Selection): vscode.Selection {
    const currentStringType = util.getCurrentStringType(doc.getText(), doc.offsetAt(sel.active));
    const paramAttempts: TraverseParams[] = [
        { currentStringType },
        { currentStringType, includeWhitespace: true },
        { currentStringType, stopAtDelims: false },
        { currentStringType, includeWhitespace: true, stopAtDelims: false },
    ];

    for (let initialNestDepth = 0; ; initialNestDepth++) {
        for (let paramAttempt of paramAttempts) {
            let maybeNewSel = expandSelection(doc, sel, { ...paramAttempt, initialNestDepth });
            if (maybeNewSel === undefined) {
                vscode.window.showInformationMessage("ArgSelect: Nothing to expand selection to");
                return sel;
            }
            if (!sel.contains(maybeNewSel) && (maybeNewSel.contains(sel) || sel.isEmpty)) {
                return maybeNewSel;
            }
        }
    }
}

export function selectArg() {
    const editor = vscode.window.activeTextEditor;

    if (!editor) {
        return;
    }

    editor.selections = editor.selections.map(sel => expandSelectionDispatcher(editor.document, sel));
}