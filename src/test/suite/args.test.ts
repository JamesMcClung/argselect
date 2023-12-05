import * as assert from 'assert';

import { Args } from '../../args';

suite('Args Test Suite', () => {
    test('constructor.basic', () => {
        assert.throws(() => new Args(String.raw`(1, 45)`, 0));
        assert.throws(() => new Args(String.raw`(1, 45)`, 7));

        for (let i = 1; i <= 6; i++) {
            let args = new Args(String.raw`(1, 45)`, i);
            assert.deepStrictEqual(["(", ", ", ")"], args.punctuation);
            assert.deepStrictEqual(["1", "45"], args.contents);
        }
    });

    test('constructor.nested', () => {
        assert.throws(() => new Args(String.raw`(1, (5,7))`, 0));
        assert.throws(() => new Args(String.raw`(1, (5,7))`, 10));

        let argsOuter = new Args(String.raw`(1, (5,7))`, 2);
        assert.deepStrictEqual(["(", ", ", ")"], argsOuter.punctuation);
        assert.deepStrictEqual(["1", "(5,7)"], argsOuter.contents);

        let argsInner = new Args(String.raw`(1, (5,7))`, 5);
        assert.deepStrictEqual(["(", ",", ")"], argsInner.punctuation);
        assert.deepStrictEqual(["5", "7"], argsInner.contents);
    });

    test('constructor.weirdSpaces', () => {
        let args = new Args(String.raw`( 2 , 6 8 )`, 2);
        assert.deepStrictEqual(["( ", " , ", " )"], args.punctuation);
        assert.deepStrictEqual(["2", "6 8"], args.contents);
    });
});

