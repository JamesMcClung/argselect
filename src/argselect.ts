import * as vscode from 'vscode';
import * as util from './util';
import { Args } from './args';

function selectAtCursor(doc: vscode.TextDocument, cursorOffset: number, traverseParams: util.TraverseParams = {}): vscode.Selection | undefined {
    const text = doc.getText();

    let selStartOffset = util.traverseUntilUnmatchedParen(text, cursorOffset, -1, traverseParams);
    let selEndOffset = util.traverseUntilUnmatchedParen(text, cursorOffset, 1, traverseParams);
    if (selEndOffset === undefined || selStartOffset === undefined) {
        return undefined; // hi jam!
    }

    if (traverseParams.includeWhitespace) {
        if (util.DELIMS.includes(text[selEndOffset])) {
            selEndOffset += 1;
        } else if (util.DELIMS.includes(text[selStartOffset])) {
            selStartOffset -= 1;
        }
    }

    const anchorPos = doc.positionAt(selStartOffset + 1);
    const activePos = doc.positionAt(selEndOffset);
    const newSel = new vscode.Selection(anchorPos, activePos);
    if (newSel.isReversed) {
        // happens when selecting pure whitespace as an arg
        return new vscode.Selection(activePos, anchorPos);
    }
    return newSel;
}

function expandSelection(doc: vscode.TextDocument, sel: vscode.Selection): vscode.Selection {
    const currentStringType = util.getCurrentStringType(doc.getText(), doc.offsetAt(sel.active));
    const paramAttempts: util.TraverseParams[] = [
        { currentStringType },
        { currentStringType, includeWhitespace: true },
        { currentStringType, stopAtDelims: false },
        { currentStringType, includeWhitespace: true, stopAtDelims: false },
    ];

    for (let initialNestDepth = 0; ; initialNestDepth++) {
        for (let paramAttempt of paramAttempts) {
            let maybeNewSel = selectAtCursor(doc, doc.offsetAt(sel.active), { ...paramAttempt, initialNestDepth });
            if (maybeNewSel === undefined) {
                return sel;
            }
            if (!sel.contains(maybeNewSel) && (maybeNewSel.contains(sel) || sel.isEmpty)) {
                return maybeNewSel;
            }
        }
    }
}

function getArgsAt(doc: vscode.TextDocument, sel: vscode.Selection): Args | undefined {
    if (sel.isEmpty) {
        return new Args(doc.getText(), doc.offsetAt(sel.start));
    }

    // start search inside parens if we're at them; if not, adding 1 doesn't matter
    const searchStart = doc.offsetAt(sel.start) + 1;
    const currentStringType = util.getCurrentStringType(doc.getText(), searchStart);
    const traverseParams: util.TraverseParams = { currentStringType, includeWhitespace: true, skipDelims: Infinity };

    for (let initialNestDepth = 0; ; initialNestDepth++) {
        let maybeNewSel = selectAtCursor(doc, searchStart, { ...traverseParams, initialNestDepth });

        if (maybeNewSel === undefined) {
            return undefined;
        }

        // hack to include parens, since selectAtCursor never includes them
        const innerStartOffset = doc.offsetAt(maybeNewSel.start);
        maybeNewSel = new vscode.Selection(doc.positionAt(-1 + innerStartOffset), doc.positionAt(1 + doc.offsetAt(maybeNewSel.end)));

        if (maybeNewSel.contains(sel) && !maybeNewSel.isEqual(sel)) {
            return new Args(doc.getText(), innerStartOffset);
        }
    }
}

export function selectArg() {
    const editor = vscode.window.activeTextEditor;

    if (!editor) {
        return;
    }

    editor.selections = editor.selections.map(sel => expandSelection(editor.document, sel));
}

function moveArg(editor: vscode.TextEditor, sel: vscode.Selection, dir: -1 | 1): vscode.Selection {
    const doc = editor.document;

    if (sel.isEmpty) {
        const newCursorOffset = util.moveCursor(doc.getText(), doc.offsetAt(sel.active), dir);
        if (newCursorOffset === undefined) {
            return sel;
        }
        const newPos = doc.positionAt(newCursorOffset);
        return new vscode.Selection(newPos, newPos);
    }

    const args = getArgsAt(doc, sel);
    if (args === undefined) {
        return sel;
    }

    const [leftOffset, rightOffset] = args.moveArgsAt(doc.offsetAt(sel.start), doc.offsetAt(sel.end), dir);
    editor.edit((edit: vscode.TextEditorEdit) => {
        const startPos = doc.positionAt(args.getStartOffset());
        const endPos = doc.positionAt(args.getEndOffset() + 1);
        edit.replace(new vscode.Range(startPos, endPos), args.toString());
    });
    if (sel.isReversed) {
        return new vscode.Selection(doc.positionAt(rightOffset), doc.positionAt(leftOffset));
    } else {
        return new vscode.Selection(doc.positionAt(leftOffset), doc.positionAt(rightOffset));
    }
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