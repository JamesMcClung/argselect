import * as vscode from 'vscode';
import * as util from './util';
import { Args } from './args';

export function helloWorld() {
    vscode.window.showInformationMessage('Hello World 2 from argselect!');
}

const DELIMS = [","];

function expandSelection(doc: vscode.TextDocument, sel: vscode.Selection, traverseParams: util.TraverseParams = {}): vscode.Selection | undefined {
    const text = doc.getText();
    const startOffset = doc.offsetAt(sel.active);

    let openingParenOffset = util.traverseUntilUnmatchedParen(text, startOffset, -1, traverseParams);
    let closingParenOffset = util.traverseUntilUnmatchedParen(text, startOffset, 1, traverseParams);
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
    const paramAttempts: util.TraverseParams[] = [
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

function shiftSelection(doc: vscode.TextDocument, sel: vscode.Selection, deltaOffset: number): vscode.Selection {
    const newActiveOffset = doc.offsetAt(sel.active) + deltaOffset;
    const newAnchorOffset = doc.offsetAt(sel.anchor) + deltaOffset;
    return new vscode.Selection(doc.positionAt(newAnchorOffset), doc.positionAt(newActiveOffset));
}

function moveArg(editor: vscode.TextEditor, sel: vscode.Selection, dir: -1 | 1): vscode.Selection {
    const doc = editor.document;
    const activeOffset = doc.offsetAt(sel.active);

    if (sel.isEmpty) {
        const newCursorOffset = util.moveCursor(doc.getText(), activeOffset, dir);
        if (newCursorOffset === undefined) {
            return sel;
        }
        const newPos = doc.positionAt(newCursorOffset);
        return new vscode.Selection(newPos, newPos);
    }

    const args = new Args(doc.getText(), activeOffset);
    const deltaOffset = args.moveArgAt(activeOffset, dir);
    editor.edit((edit: vscode.TextEditorEdit) => {
        const startPos = doc.positionAt(args.getStartOffset());
        const endPos = doc.positionAt(args.getEndOffset() + 1);
        edit.replace(new vscode.Range(startPos, endPos), args.toString());
    });
    return shiftSelection(doc, sel, deltaOffset);
}

export function moveArgLeft() {
    const editor = vscode.window.activeTextEditor;

    if (!editor) {
        return;
    }

    editor.selections = editor.selections.map(sel => moveArg(editor, sel, -1));
}

export function moveArgRight() {
    const editor = vscode.window.activeTextEditor;

    if (!editor) {
        return;
    }

    editor.selections = editor.selections.map(sel => moveArg(editor, sel, 1));
}