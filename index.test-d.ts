import {expectType, expectError} from 'tsd';
import {
	diff,
	patch,
	applyPatch,
	type Operation,
} from './index.js';

expectType<Operation[]>(diff({a: 1}, {a: 2}));
expectType<Operation[]>(diff({}, {a: 1}));
expectType<Operation[]>(diff({a: 1}, {}));

expectType<Record<string, unknown>>(patch({a: 1}, [{op: 'replace', path: '/a', value: 2}]));
expectType<Record<string, unknown>>(applyPatch({a: 1}, [{op: 'add', path: '/b', value: 3}]));

expectError(diff('not an object', {}));
expectError(patch('not an object', []));
