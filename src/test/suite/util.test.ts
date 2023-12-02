import * as assert from 'assert';

import * as vscode from 'vscode';
import * as util from '../../util';

suite('Extension Test Suite', () => {
    vscode.window.showInformationMessage('Start all tests.');

    test('isEscaped', () => {
        assert.strictEqual(false, util.isEscaped(String.raw`"\""`, 0));
        assert.strictEqual(false, util.isEscaped(String.raw`"\""`, 1));
        assert.strictEqual(true, util.isEscaped(String.raw`"\""`, 2));
        assert.strictEqual(false, util.isEscaped(String.raw`"\""`, 3));

        assert.strictEqual(false, util.isEscaped(String.raw`"\\"`, 0));
        assert.strictEqual(false, util.isEscaped(String.raw`"\\"`, 1));
        assert.strictEqual(true, util.isEscaped(String.raw`"\\"`, 2));
        assert.strictEqual(false, util.isEscaped(String.raw`"\\"`, 3));

        assert.strictEqual(false, util.isEscaped(String.raw`"\\\""`, 0));
        assert.strictEqual(false, util.isEscaped(String.raw`"\\\""`, 1));
        assert.strictEqual(true, util.isEscaped(String.raw`"\\\""`, 2));
        assert.strictEqual(false, util.isEscaped(String.raw`"\\\""`, 3));
        assert.strictEqual(true, util.isEscaped(String.raw`"\\\""`, 4));
        assert.strictEqual(false, util.isEscaped(String.raw`"\\\""`, 5));
    });
});
