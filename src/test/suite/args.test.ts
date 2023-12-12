import * as assert from 'assert';

import { Arg, Args } from '../../args';

function toArgs(...args: string[]): Arg[] {
    return args.map(arg => new Arg(arg));
}

function assertArgsEqual(args1: Arg[], args2: Arg[]) {
    assert.strictEqual(args1.length, args2.length);
    for (let i = 0; i < args1.length; i++) {
        assert.strictEqual(true, args1[i].equals(args2[i]));
    }
}

suite('Args Test Suite', () => {
    test('constructor.basic', () => {
        assert.throws(() => new Args(String.raw`(1, 45)`, 0));
        assert.throws(() => new Args(String.raw`(1, 45)`, 7));

        for (let i = 1; i <= 6; i++) {
            let args = new Args(String.raw`(1, 45)`, i);
            assert.deepStrictEqual(["(", ",", ")"], args.punctuation);
            assertArgsEqual(toArgs("1", " 45"), args.args);
        }
    });

    test('constructor.nested', () => {
        assert.throws(() => new Args(String.raw`(1, (5,7))`, 0));
        assert.throws(() => new Args(String.raw`(1, (5,7))`, 10));

        let argsOuter = new Args(String.raw`(1, (5,7))`, 2);
        assert.deepStrictEqual(["(", ",", ")"], argsOuter.punctuation);
        assertArgsEqual(toArgs("1", " (5,7)"), argsOuter.args);

        let argsInner = new Args(String.raw`(1, (5,7))`, 5);
        assert.deepStrictEqual(["(", ",", ")"], argsInner.punctuation);
        assertArgsEqual(toArgs("5", "7"), argsInner.args);
    });

    test('constructor.weirdSpaces', () => {
        let args = new Args(String.raw`( 2 , 6 8 )`, 2);
        assert.deepStrictEqual(["(", ",", ")"], args.punctuation);
        assertArgsEqual(toArgs(" 2 ", " 6 8 "), args.args);
    });

    test('getArgIdx', () => {
        let args = new Args(String.raw`(123, 678)`, 1);
        assert.strictEqual(undefined, args.getArgIdx(0));
        assert.strictEqual(0, args.getArgIdx(1));
        assert.strictEqual(0, args.getArgIdx(2));
        assert.strictEqual(0, args.getArgIdx(3));
        assert.strictEqual(0, args.getArgIdx(4));
        assert.strictEqual(1, args.getArgIdx(5));
        assert.strictEqual(1, args.getArgIdx(6));
        assert.strictEqual(1, args.getArgIdx(7));
        assert.strictEqual(1, args.getArgIdx(8));
        assert.strictEqual(1, args.getArgIdx(9));
        assert.strictEqual(undefined, args.getArgIdx(10));
    });

    test('moveArgAt.content', () => {
        let args = new Args(String.raw`(hi, th ,  ere  )`, 1);
        assert.strictEqual("(hi, th ,  ere  )", args.toString());

        assert.strictEqual(4, args.moveArgAt(1, +1));
        assert.strictEqual("(th, hi ,  ere  )", args.toString());

        assert.strictEqual(-6, args.moveArgAt(11, -1));
        assert.strictEqual("(th, ere ,  hi  )", args.toString());
    });
});

suite('Args Test Suite', () => {
    test('constructor.noSpace', () => {
        let arg = new Arg("noSpace");
        assert.strictEqual("", arg.leftSpace);
        assert.strictEqual("noSpace", arg.content);
        assert.strictEqual("", arg.rightSpace);
    });

    test('constructor.leftSpace', () => {
        let arg = new Arg(" leftSpace");
        assert.strictEqual(" ", arg.leftSpace);
        assert.strictEqual("leftSpace", arg.content);
        assert.strictEqual("", arg.rightSpace);
    });

    test('constructor.rightSpace', () => {
        let arg = new Arg("rightSpace ");
        assert.strictEqual("", arg.leftSpace);
        assert.strictEqual("rightSpace", arg.content);
        assert.strictEqual(" ", arg.rightSpace);
    });

    test('constructor.bothSpace', () => {
        let arg = new Arg(" bothSpace ");
        assert.strictEqual(" ", arg.leftSpace);
        assert.strictEqual("bothSpace", arg.content);
        assert.strictEqual(" ", arg.rightSpace);
    });
});
