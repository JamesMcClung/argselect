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

    test('traverseUntilOutOfString', () => {
        assert.strictEqual(undefined, util.traverseUntilOutOfString(String.raw`0, "45", 9`, 3, -1, '"'));
        assert.strictEqual(2, util.traverseUntilOutOfString(String.raw`0, "45", 9`, 4, -1, '"'));
        assert.strictEqual(2, util.traverseUntilOutOfString(String.raw`0, "45", 9`, 5, -1, '"'));
        assert.strictEqual(2, util.traverseUntilOutOfString(String.raw`0, "45", 9`, 6, -1, '"'));
        assert.strictEqual(7, util.traverseUntilOutOfString(String.raw`0, "45", 9`, 4, 1, '"'));
        assert.strictEqual(7, util.traverseUntilOutOfString(String.raw`0, "45", 9`, 5, 1, '"'));
        assert.strictEqual(7, util.traverseUntilOutOfString(String.raw`0, "45", 9`, 6, 1, '"'));
        assert.strictEqual(undefined, util.traverseUntilOutOfString(String.raw`0, "45", 9`, 7, 1, '"'));

        assert.strictEqual(2, util.traverseUntilOutOfString(String.raw`0, "\"", 9`, 4, -1, '"'));
        assert.strictEqual(2, util.traverseUntilOutOfString(String.raw`0, "\"", 9`, 5, -1, '"'));
        assert.strictEqual(2, util.traverseUntilOutOfString(String.raw`0, "\"", 9`, 6, -1, '"'));
        assert.strictEqual(7, util.traverseUntilOutOfString(String.raw`0, "\"", 9`, 4, 1, '"'));
        assert.strictEqual(7, util.traverseUntilOutOfString(String.raw`0, "\"", 9`, 5, 1, '"'));
        assert.strictEqual(7, util.traverseUntilOutOfString(String.raw`0, "\"", 9`, 6, 1, '"'));

        assert.strictEqual(2, util.traverseUntilOutOfString(String.raw`0, "'", 8`, 4, -1, '"'));
        assert.strictEqual(2, util.traverseUntilOutOfString(String.raw`0, "'", 8`, 5, -1, '"'));
        assert.strictEqual(6, util.traverseUntilOutOfString(String.raw`0, "'", 8`, 4, 1, '"'));
        assert.strictEqual(6, util.traverseUntilOutOfString(String.raw`0, "'", 8`, 5, 1, '"'));

        assert.strictEqual(0, util.traverseUntilOutOfString('0"2\n4"6', 3, -1, '"'));
        assert.strictEqual(undefined, util.traverseUntilOutOfString('0"2\n4"6', 4, -1, '"'));
        assert.strictEqual(undefined, util.traverseUntilOutOfString('0"2\n4"6', 3, 1, '"'));
        assert.strictEqual(6, util.traverseUntilOutOfString('0"2\n4"6', 4, 1, '"'));
    });
});
