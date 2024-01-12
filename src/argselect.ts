import * as vscode from 'vscode';
import * as util from './util';
import { Args } from './args';

function offsetsToSelection(offsets: [number, number] | undefined, doc: vscode.TextDocument): vscode.Selection | undefined {
    if (offsets === undefined) {
        return undefined;
    }

    const anchor = doc.positionAt(offsets[0]);
    const active = doc.positionAt(offsets[1]);
    return new vscode.Selection(anchor, active);
}

function expandSelection(doc: vscode.TextDocument, sel: vscode.Selection): vscode.Selection {
    const text = doc.getText();
    const currentStringType = util.getCurrentStringType(text, doc.offsetAt(sel.active));
    const paramAttempts: util.TraverseParams[] = [
        { currentStringType },
        { currentStringType, includeWhitespace: true },
        { currentStringType, skipDelims: Infinity },
        { currentStringType, includeWhitespace: true, skipDelims: Infinity },
    ];

    for (let initialNestDepth = 0; ; initialNestDepth++) {
        for (let paramAttempt of paramAttempts) {
            let maybeNewSel = offsetsToSelection(util.selectAtCursor(text, doc.offsetAt(sel.active), { ...paramAttempt, initialNestDepth }), doc);
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
    const text = doc.getText();

    if (sel.isEmpty) {
        return new Args(text, doc.offsetAt(sel.start));
    }

    // start search inside parens if we're at them; if not, adding 1 doesn't matter
    const searchStart = doc.offsetAt(sel.start) + 1;
    const currentStringType = util.getCurrentStringType(text, searchStart);
    const traverseParams: util.TraverseParams = { currentStringType, includeWhitespace: true, skipDelims: Infinity };

    for (let initialNestDepth = 0; ; initialNestDepth++) {
        let maybeNewSelOffsets = util.selectAtCursor(text, searchStart, { ...traverseParams, initialNestDepth });
        if (maybeNewSelOffsets === undefined) {
            return undefined;
        }

        // hack to include parens, since selectAtCursor never includes them
        const innerStartOffset = maybeNewSelOffsets[0];
        const newSel = offsetsToSelection([maybeNewSelOffsets[0] - 1, maybeNewSelOffsets[1] + 1], doc)!;

        if (newSel.contains(sel) && !newSel.isEqual(sel)) {
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
        const newCursorOffset = util.getCursorOffsetAfterJump(doc.getText(), doc.offsetAt(sel.active), dir);
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