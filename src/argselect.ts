import * as vscode from 'vscode';

export function helloWorld() {
    vscode.window.showInformationMessage('Hello World 2 from argselect!');
}

function expandSelection(doc: vscode.TextDocument, sel: vscode.Selection): vscode.Selection {
    const anchorPos = doc.lineAt(sel.start.line).range.start;
    const activePos = doc.lineAt(sel.end.line).range.end;
    return new vscode.Selection(anchorPos, activePos);
}

export function selectArg() {
    const editor = vscode.window.activeTextEditor;

    if (!editor) {
        return;
    }

    editor.selections = editor.selections.map(sel => expandSelection(editor.document, sel));
}