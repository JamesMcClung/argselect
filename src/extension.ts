import * as vscode from 'vscode';
import * as argselect from "./argselect";

export function activate(context: vscode.ExtensionContext) {
	context.subscriptions.push(vscode.commands.registerCommand('argselect.selectArg', argselect.selectArg));
	context.subscriptions.push(vscode.commands.registerCommand('argselect.moveArgLeft', argselect.moveOrJumpArgsLeft));
	context.subscriptions.push(vscode.commands.registerCommand('argselect.moveArgRight', argselect.moveOrJumpArgsRight));
}

export function deactivate() { }
