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

    test('getCurrentStringType', () => {
        assert.strictEqual(undefined, util.getCurrentStringType(String.raw`"123"`, 0));
        assert.strictEqual('"', util.getCurrentStringType(String.raw`"123"`, 1));
        assert.strictEqual('"', util.getCurrentStringType(String.raw`"123"`, 2));
        assert.strictEqual('"', util.getCurrentStringType(String.raw`"123"`, 3));
        assert.strictEqual('"', util.getCurrentStringType(String.raw`"123"`, 4));
        assert.strictEqual(undefined, util.getCurrentStringType(String.raw`"123"`, 5));

        assert.strictEqual(undefined, util.getCurrentStringType(String.raw`"1\""`, 0));
        assert.strictEqual('"', util.getCurrentStringType(String.raw`"1\""`, 1));
        assert.strictEqual('"', util.getCurrentStringType(String.raw`"1\""`, 2));
        assert.strictEqual('"', util.getCurrentStringType(String.raw`"1\""`, 3));
        assert.strictEqual('"', util.getCurrentStringType(String.raw`"1\""`, 4));
        assert.strictEqual(undefined, util.getCurrentStringType(String.raw`"1\""`, 5));

        assert.strictEqual(undefined, util.getCurrentStringType(String.raw`"1"3'5'`, 0));
        assert.strictEqual('"', util.getCurrentStringType(String.raw`"1"3'5'`, 1));
        assert.strictEqual('"', util.getCurrentStringType(String.raw`"1"3'5'`, 2));
        assert.strictEqual(undefined, util.getCurrentStringType(String.raw`"1"3'5'`, 3));
        assert.strictEqual(undefined, util.getCurrentStringType(String.raw`"1"3'5'`, 4));
        assert.strictEqual("'", util.getCurrentStringType(String.raw`"1"3'5'`, 5));
        assert.strictEqual("'", util.getCurrentStringType(String.raw`"1"3'5'`, 6));
        assert.strictEqual(undefined, util.getCurrentStringType(String.raw`"1"3'5'`, 7));

        assert.strictEqual(undefined, util.getCurrentStringType(String.raw`"12'45"`, 0));
        assert.strictEqual('"', util.getCurrentStringType(String.raw`"12'45"`, 1));
        assert.strictEqual('"', util.getCurrentStringType(String.raw`"12'45"`, 2));
        assert.strictEqual('"', util.getCurrentStringType(String.raw`"12'45"`, 3));
        assert.strictEqual('"', util.getCurrentStringType(String.raw`"12'45"`, 4));
        assert.strictEqual('"', util.getCurrentStringType(String.raw`"12'45"`, 5));
        assert.strictEqual('"', util.getCurrentStringType(String.raw`"12'45"`, 6));
        assert.strictEqual(undefined, util.getCurrentStringType(String.raw`"12'45"`, 7));

        assert.strictEqual(undefined, util.getCurrentStringType(String.raw`"12'4'6"`, 0));
        assert.strictEqual('"', util.getCurrentStringType(String.raw`"12'4'6"`, 1));
        assert.strictEqual('"', util.getCurrentStringType(String.raw`"12'4'6"`, 2));
        assert.strictEqual('"', util.getCurrentStringType(String.raw`"12'4'6"`, 3));
        assert.strictEqual('"', util.getCurrentStringType(String.raw`"12'4'6"`, 4));
        assert.strictEqual('"', util.getCurrentStringType(String.raw`"12'4'6"`, 5));
        assert.strictEqual('"', util.getCurrentStringType(String.raw`"12'4'6"`, 6));
        assert.strictEqual('"', util.getCurrentStringType(String.raw`"12'4'6"`, 7));
        assert.strictEqual(undefined, util.getCurrentStringType(String.raw`"12'4'6"`, 8));
    });
});
