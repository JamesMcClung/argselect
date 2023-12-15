import * as assert from 'assert';

import * as util from '../../util';

suite('Util Test Suite', () => {
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

    test('traverseUntilUnmatchedParen.parens', () => {
        assert.strictEqual(undefined, util.traverseUntilUnmatchedParen(String.raw`0(234)`, 0, -1));
        assert.strictEqual(undefined, util.traverseUntilUnmatchedParen(String.raw`0(234)`, 1, -1));
        assert.strictEqual(1, util.traverseUntilUnmatchedParen(String.raw`0(234)`, 2, -1));
        assert.strictEqual(1, util.traverseUntilUnmatchedParen(String.raw`0(234)`, 3, -1));
        assert.strictEqual(1, util.traverseUntilUnmatchedParen(String.raw`0(234)`, 4, -1));
        assert.strictEqual(1, util.traverseUntilUnmatchedParen(String.raw`0(234)`, 5, -1));
        assert.strictEqual(undefined, util.traverseUntilUnmatchedParen(String.raw`0(234)`, 6, -1));

        assert.strictEqual(undefined, util.traverseUntilUnmatchedParen(String.raw`0(234)`, 0, 1));
        assert.strictEqual(undefined, util.traverseUntilUnmatchedParen(String.raw`0(234)`, 1, 1));
        assert.strictEqual(5, util.traverseUntilUnmatchedParen(String.raw`0(234)`, 2, 1));
        assert.strictEqual(5, util.traverseUntilUnmatchedParen(String.raw`0(234)`, 3, 1));
        assert.strictEqual(5, util.traverseUntilUnmatchedParen(String.raw`0(234)`, 4, 1));
        assert.strictEqual(5, util.traverseUntilUnmatchedParen(String.raw`0(234)`, 5, 1));
        assert.strictEqual(undefined, util.traverseUntilUnmatchedParen(String.raw`0(234)`, 6, 1));
    });
    test('traverseUntilUnmatchedParen.comma', () => {
        assert.strictEqual(undefined, util.traverseUntilUnmatchedParen(String.raw`0(2,45)`, 0, -1));
        assert.strictEqual(undefined, util.traverseUntilUnmatchedParen(String.raw`0(2,45)`, 1, -1));
        assert.strictEqual(1, util.traverseUntilUnmatchedParen(String.raw`0(2,45)`, 2, -1));
        assert.strictEqual(1, util.traverseUntilUnmatchedParen(String.raw`0(2,45)`, 3, -1));
        assert.strictEqual(3, util.traverseUntilUnmatchedParen(String.raw`0(2,45)`, 4, -1));
        assert.strictEqual(3, util.traverseUntilUnmatchedParen(String.raw`0(2,45)`, 5, -1));
        assert.strictEqual(3, util.traverseUntilUnmatchedParen(String.raw`0(2,45)`, 6, -1));
        assert.strictEqual(undefined, util.traverseUntilUnmatchedParen(String.raw`0(2,45)`, 7, -1));

        assert.strictEqual(undefined, util.traverseUntilUnmatchedParen(String.raw`0(2,45)`, 0, 1));
        assert.strictEqual(undefined, util.traverseUntilUnmatchedParen(String.raw`0(2,45)`, 1, 1));
        assert.strictEqual(3, util.traverseUntilUnmatchedParen(String.raw`0(2,45)`, 2, 1));
        assert.strictEqual(3, util.traverseUntilUnmatchedParen(String.raw`0(2,45)`, 3, 1));
        assert.strictEqual(6, util.traverseUntilUnmatchedParen(String.raw`0(2,45)`, 4, 1));
        assert.strictEqual(6, util.traverseUntilUnmatchedParen(String.raw`0(2,45)`, 5, 1));
        assert.strictEqual(6, util.traverseUntilUnmatchedParen(String.raw`0(2,45)`, 6, 1));
        assert.strictEqual(undefined, util.traverseUntilUnmatchedParen(String.raw`0(2,45)`, 7, 1));
    });
    test('traverseUntilUnmatchedParen.space', () => {
        assert.strictEqual(undefined, util.traverseUntilUnmatchedParen(String.raw`0(2, 5)`, 0, -1));
        assert.strictEqual(undefined, util.traverseUntilUnmatchedParen(String.raw`0(2, 5)`, 1, -1));
        assert.strictEqual(1, util.traverseUntilUnmatchedParen(String.raw`0(2, 5)`, 2, -1));
        assert.strictEqual(1, util.traverseUntilUnmatchedParen(String.raw`0(2, 5)`, 3, -1));
        assert.strictEqual(4, util.traverseUntilUnmatchedParen(String.raw`0(2, 5)`, 4, -1));
        assert.strictEqual(4, util.traverseUntilUnmatchedParen(String.raw`0(2, 5)`, 5, -1));
        assert.strictEqual(4, util.traverseUntilUnmatchedParen(String.raw`0(2, 5)`, 6, -1));
        assert.strictEqual(undefined, util.traverseUntilUnmatchedParen(String.raw`0(2, 5)`, 7, -1));

        assert.strictEqual(undefined, util.traverseUntilUnmatchedParen(String.raw`0(2, 5)`, 0, 1));
        assert.strictEqual(undefined, util.traverseUntilUnmatchedParen(String.raw`0(2, 5)`, 1, 1));
        assert.strictEqual(3, util.traverseUntilUnmatchedParen(String.raw`0(2, 5)`, 2, 1));
        assert.strictEqual(3, util.traverseUntilUnmatchedParen(String.raw`0(2, 5)`, 3, 1));
        assert.strictEqual(6, util.traverseUntilUnmatchedParen(String.raw`0(2, 5)`, 4, 1));
        assert.strictEqual(6, util.traverseUntilUnmatchedParen(String.raw`0(2, 5)`, 5, 1));
        assert.strictEqual(6, util.traverseUntilUnmatchedParen(String.raw`0(2, 5)`, 6, 1));
        assert.strictEqual(undefined, util.traverseUntilUnmatchedParen(String.raw`0(2, 5)`, 7, 1));
    });
    test('traverseUntilUnmatchedParen.nested', () => {
        assert.strictEqual(undefined, util.traverseUntilUnmatchedParen(String.raw`(1, (5, 8))`, 0, -1));
        assert.strictEqual(0, util.traverseUntilUnmatchedParen(String.raw`(1, (5, 8))`, 1, -1));
        assert.strictEqual(0, util.traverseUntilUnmatchedParen(String.raw`(1, (5, 8))`, 2, -1));
        assert.strictEqual(3, util.traverseUntilUnmatchedParen(String.raw`(1, (5, 8))`, 3, -1));
        assert.strictEqual(3, util.traverseUntilUnmatchedParen(String.raw`(1, (5, 8))`, 4, -1));
        assert.strictEqual(4, util.traverseUntilUnmatchedParen(String.raw`(1, (5, 8))`, 5, -1));
        assert.strictEqual(4, util.traverseUntilUnmatchedParen(String.raw`(1, (5, 8))`, 6, -1));
        assert.strictEqual(7, util.traverseUntilUnmatchedParen(String.raw`(1, (5, 8))`, 7, -1));
        assert.strictEqual(7, util.traverseUntilUnmatchedParen(String.raw`(1, (5, 8))`, 8, -1));
        assert.strictEqual(7, util.traverseUntilUnmatchedParen(String.raw`(1, (5, 8))`, 9, -1));
        assert.strictEqual(3, util.traverseUntilUnmatchedParen(String.raw`(1, (5, 8))`, 10, -1));
        assert.strictEqual(undefined, util.traverseUntilUnmatchedParen(String.raw`(1, (5, 8))`, 11, -1));

        assert.strictEqual(undefined, util.traverseUntilUnmatchedParen(String.raw`(1, (5, 8))`, 0, 1));
        assert.strictEqual(2, util.traverseUntilUnmatchedParen(String.raw`(1, (5, 8))`, 1, 1));
        assert.strictEqual(2, util.traverseUntilUnmatchedParen(String.raw`(1, (5, 8))`, 2, 1));
        assert.strictEqual(10, util.traverseUntilUnmatchedParen(String.raw`(1, (5, 8))`, 3, 1));
        assert.strictEqual(10, util.traverseUntilUnmatchedParen(String.raw`(1, (5, 8))`, 4, 1));
        assert.strictEqual(6, util.traverseUntilUnmatchedParen(String.raw`(1, (5, 8))`, 5, 1));
        assert.strictEqual(6, util.traverseUntilUnmatchedParen(String.raw`(1, (5, 8))`, 6, 1));
        assert.strictEqual(9, util.traverseUntilUnmatchedParen(String.raw`(1, (5, 8))`, 7, 1));
        assert.strictEqual(9, util.traverseUntilUnmatchedParen(String.raw`(1, (5, 8))`, 8, 1));
        assert.strictEqual(9, util.traverseUntilUnmatchedParen(String.raw`(1, (5, 8))`, 9, 1));
        assert.strictEqual(10, util.traverseUntilUnmatchedParen(String.raw`(1, (5, 8))`, 10, 1));
        assert.strictEqual(undefined, util.traverseUntilUnmatchedParen(String.raw`(1, (5, 8))`, 11, 1));
    });
    test('traverseUntilUnmatchedParen.string', () => {
        assert.strictEqual(undefined, util.traverseUntilUnmatchedParen(String.raw`(1, "5", 9)`, 0, -1));
        assert.strictEqual(0, util.traverseUntilUnmatchedParen(String.raw`(1, "5", 9)`, 1, -1));
        assert.strictEqual(0, util.traverseUntilUnmatchedParen(String.raw`(1, "5", 9)`, 2, -1));
        assert.strictEqual(3, util.traverseUntilUnmatchedParen(String.raw`(1, "5", 9)`, 3, -1));
        assert.strictEqual(3, util.traverseUntilUnmatchedParen(String.raw`(1, "5", 9)`, 4, -1));
        assert.strictEqual(3, util.traverseUntilUnmatchedParen(String.raw`(1, "5", 9)`, 5, -1, { currentStringType: '"' }));
        assert.strictEqual(3, util.traverseUntilUnmatchedParen(String.raw`(1, "5", 9)`, 6, -1, { currentStringType: '"' }));
        assert.strictEqual(3, util.traverseUntilUnmatchedParen(String.raw`(1, "5", 9)`, 7, -1));
        assert.strictEqual(8, util.traverseUntilUnmatchedParen(String.raw`(1, "5", 9)`, 8, -1));
        assert.strictEqual(8, util.traverseUntilUnmatchedParen(String.raw`(1, "5", 9)`, 9, -1));
        assert.strictEqual(8, util.traverseUntilUnmatchedParen(String.raw`(1, "5", 9)`, 10, -1));
        assert.strictEqual(undefined, util.traverseUntilUnmatchedParen(String.raw`(1, "5", 9)`, 11, -1));

        assert.strictEqual(undefined, util.traverseUntilUnmatchedParen(String.raw`(1, "5", 9)`, 0, 1));
        assert.strictEqual(2, util.traverseUntilUnmatchedParen(String.raw`(1, "5", 9)`, 1, 1));
        assert.strictEqual(2, util.traverseUntilUnmatchedParen(String.raw`(1, "5", 9)`, 2, 1));
        assert.strictEqual(7, util.traverseUntilUnmatchedParen(String.raw`(1, "5", 9)`, 3, 1));
        assert.strictEqual(7, util.traverseUntilUnmatchedParen(String.raw`(1, "5", 9)`, 4, 1));
        assert.strictEqual(7, util.traverseUntilUnmatchedParen(String.raw`(1, "5", 9)`, 5, 1, { currentStringType: '"' }));
        assert.strictEqual(7, util.traverseUntilUnmatchedParen(String.raw`(1, "5", 9)`, 6, 1, { currentStringType: '"' }));
        assert.strictEqual(7, util.traverseUntilUnmatchedParen(String.raw`(1, "5", 9)`, 7, 1));
        assert.strictEqual(10, util.traverseUntilUnmatchedParen(String.raw`(1, "5", 9)`, 8, 1));
        assert.strictEqual(10, util.traverseUntilUnmatchedParen(String.raw`(1, "5", 9)`, 9, 1));
        assert.strictEqual(10, util.traverseUntilUnmatchedParen(String.raw`(1, "5", 9)`, 10, 1));
        assert.strictEqual(undefined, util.traverseUntilUnmatchedParen(String.raw`(1, "5", 9)`, 11, 1));
    });

    test('moveCursor', () => {
        assert.strictEqual(undefined, util.moveCursor(String.raw`(1, (5, 8))`, 0, -1));
        assert.strictEqual(1, util.moveCursor(String.raw`(1, (5, 8))`, 1, -1));
        assert.strictEqual(1, util.moveCursor(String.raw`(1, (5, 8))`, 2, -1));
        assert.strictEqual(1, util.moveCursor(String.raw`(1, (5, 8))`, 3, -1));
        assert.strictEqual(1, util.moveCursor(String.raw`(1, (5, 8))`, 4, -1));
        assert.strictEqual(5, util.moveCursor(String.raw`(1, (5, 8))`, 5, -1));
        assert.strictEqual(5, util.moveCursor(String.raw`(1, (5, 8))`, 6, -1));
        assert.strictEqual(5, util.moveCursor(String.raw`(1, (5, 8))`, 7, -1));
        assert.strictEqual(5, util.moveCursor(String.raw`(1, (5, 8))`, 8, -1));
        assert.strictEqual(8, util.moveCursor(String.raw`(1, (5, 8))`, 9, -1));
        assert.strictEqual(4, util.moveCursor(String.raw`(1, (5, 8))`, 10, -1));
        assert.strictEqual(undefined, util.moveCursor(String.raw`(1, (5, 8))`, 11, -1));

        assert.strictEqual(undefined, util.moveCursor(String.raw`(1, (5, 8))`, 0, 1));
        assert.strictEqual(2, util.moveCursor(String.raw`(1, (5, 8))`, 1, 1));
        assert.strictEqual(10, util.moveCursor(String.raw`(1, (5, 8))`, 2, 1));
        assert.strictEqual(10, util.moveCursor(String.raw`(1, (5, 8))`, 3, 1));
        assert.strictEqual(10, util.moveCursor(String.raw`(1, (5, 8))`, 4, 1));
        assert.strictEqual(6, util.moveCursor(String.raw`(1, (5, 8))`, 5, 1));
        assert.strictEqual(9, util.moveCursor(String.raw`(1, (5, 8))`, 6, 1));
        assert.strictEqual(9, util.moveCursor(String.raw`(1, (5, 8))`, 7, 1));
        assert.strictEqual(9, util.moveCursor(String.raw`(1, (5, 8))`, 8, 1));
        assert.strictEqual(9, util.moveCursor(String.raw`(1, (5, 8))`, 9, 1));
        assert.strictEqual(10, util.moveCursor(String.raw`(1, (5, 8))`, 10, 1));
        assert.strictEqual(undefined, util.moveCursor(String.raw`(1, (5, 8))`, 11, 1));
    });

    test('selectAtCursor.basic', () => {
        assert.deepStrictEqual(undefined, util.selectAtCursor(String.raw`(123, 67)`, 0));
        assert.deepStrictEqual([1, 4], util.selectAtCursor(String.raw`(123, 67)`, 1));
        assert.deepStrictEqual([1, 4], util.selectAtCursor(String.raw`(123, 67)`, 2));
        assert.deepStrictEqual([1, 4], util.selectAtCursor(String.raw`(123, 67)`, 3));
        assert.deepStrictEqual([1, 4], util.selectAtCursor(String.raw`(123, 67)`, 4));
        assert.deepStrictEqual([6, 8], util.selectAtCursor(String.raw`(123, 67)`, 5));
        assert.deepStrictEqual([6, 8], util.selectAtCursor(String.raw`(123, 67)`, 6));
        assert.deepStrictEqual([6, 8], util.selectAtCursor(String.raw`(123, 67)`, 7));
        assert.deepStrictEqual([6, 8], util.selectAtCursor(String.raw`(123, 67)`, 8));
        assert.deepStrictEqual(undefined, util.selectAtCursor(String.raw`(123, 67)`, 9));
    });

    test('selectAtCursor.string', () => {
        assert.deepStrictEqual(undefined, util.selectAtCursor(String.raw`("2", 67)`, 0));
        assert.deepStrictEqual([1, 4], util.selectAtCursor(String.raw`("2", 67)`, 1));
        assert.deepStrictEqual([1, 4], util.selectAtCursor(String.raw`("2", 67)`, 2, { currentStringType: '"' }));
        assert.deepStrictEqual([1, 4], util.selectAtCursor(String.raw`("2", 67)`, 3, { currentStringType: '"' }));
        assert.deepStrictEqual([1, 4], util.selectAtCursor(String.raw`("2", 67)`, 4));
        assert.deepStrictEqual([6, 8], util.selectAtCursor(String.raw`("2", 67)`, 5));
        assert.deepStrictEqual([6, 8], util.selectAtCursor(String.raw`("2", 67)`, 6));
        assert.deepStrictEqual([6, 8], util.selectAtCursor(String.raw`("2", 67)`, 7));
        assert.deepStrictEqual([6, 8], util.selectAtCursor(String.raw`("2", 67)`, 8));
        assert.deepStrictEqual(undefined, util.selectAtCursor(String.raw`("2", 67)`, 9));
    });
});
