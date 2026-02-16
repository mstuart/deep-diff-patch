import test from 'ava';
import {diff, patch, applyPatch} from './index.js';

// --- diff: additions ---

test('diff detects additions', t => {
	const result = diff({}, {a: 1});
	t.deepEqual(result, [{op: 'add', path: '/a', value: 1}]);
});

test('diff detects multiple additions', t => {
	const result = diff({}, {a: 1, b: 2});
	t.is(result.length, 2);
	t.truthy(result.find(op => op.path === '/a' && op.value === 1));
	t.truthy(result.find(op => op.path === '/b' && op.value === 2));
});

// --- diff: removals ---

test('diff detects removals', t => {
	const result = diff({a: 1}, {});
	t.deepEqual(result, [{op: 'remove', path: '/a'}]);
});

test('diff detects multiple removals', t => {
	const result = diff({a: 1, b: 2}, {});
	t.is(result.length, 2);
	t.truthy(result.find(op => op.path === '/a'));
	t.truthy(result.find(op => op.path === '/b'));
});

// --- diff: replacements ---

test('diff detects replacements', t => {
	const result = diff({a: 1}, {a: 2});
	t.deepEqual(result, [{op: 'replace', path: '/a', value: 2}]);
});

test('diff detects type change as replacement', t => {
	const result = diff({a: 1}, {a: 'one'});
	t.deepEqual(result, [{op: 'replace', path: '/a', value: 'one'}]);
});

// --- diff: nested objects ---

test('diff handles nested objects', t => {
	const result = diff({a: {b: 1}}, {a: {b: 2}});
	t.deepEqual(result, [{op: 'replace', path: '/a/b', value: 2}]);
});

test('diff handles deeply nested additions', t => {
	const result = diff({a: {b: {}}}, {a: {b: {c: 3}}});
	t.deepEqual(result, [{op: 'add', path: '/a/b/c', value: 3}]);
});

test('diff handles deeply nested removals', t => {
	const result = diff({a: {b: {c: 3}}}, {a: {b: {}}});
	t.deepEqual(result, [{op: 'remove', path: '/a/b/c'}]);
});

// --- diff: arrays ---

test('diff handles arrays by index', t => {
	const result = diff({items: [1, 2, 3]}, {items: [1, 2, 4]});
	t.deepEqual(result, [{op: 'replace', path: '/items/2', value: 4}]);
});

test('diff handles array additions', t => {
	const result = diff({items: [1]}, {items: [1, 2]});
	t.deepEqual(result, [{op: 'add', path: '/items/1', value: 2}]);
});

test('diff handles array removals', t => {
	const result = diff({items: [1, 2]}, {items: [1]});
	t.deepEqual(result, [{op: 'remove', path: '/items/1'}]);
});

// --- diff: empty objects ---

test('diff with empty objects returns empty array', t => {
	t.deepEqual(diff({}, {}), []);
});

test('diff with identical objects returns empty array', t => {
	t.deepEqual(diff({a: 1, b: 'two'}, {a: 1, b: 'two'}), []);
});

test('diff with identical nested objects returns empty array', t => {
	t.deepEqual(diff({a: {b: {c: 1}}}, {a: {b: {c: 1}}}), []);
});

// --- patch: add ---

test('patch applies add operation', t => {
	const result = patch({}, [{op: 'add', path: '/a', value: 1}]);
	t.deepEqual(result, {a: 1});
});

test('patch applies nested add', t => {
	const result = patch({a: {}}, [{op: 'add', path: '/a/b', value: 2}]);
	t.deepEqual(result, {a: {b: 2}});
});

// --- patch: remove ---

test('patch applies remove operation', t => {
	const result = patch({a: 1, b: 2}, [{op: 'remove', path: '/a'}]);
	t.deepEqual(result, {b: 2});
});

test('patch applies nested remove', t => {
	const result = patch({a: {b: 1, c: 2}}, [{op: 'remove', path: '/a/b'}]);
	t.deepEqual(result, {a: {c: 2}});
});

// --- patch: replace ---

test('patch applies replace operation', t => {
	const result = patch({a: 1}, [{op: 'replace', path: '/a', value: 2}]);
	t.deepEqual(result, {a: 2});
});

test('patch applies nested replace', t => {
	const result = patch({a: {b: 1}}, [{op: 'replace', path: '/a/b', value: 99}]);
	t.deepEqual(result, {a: {b: 99}});
});

// --- patch: multiple operations ---

test('patch applies multiple operations', t => {
	const result = patch(
		{a: 1, b: 2},
		[
			{op: 'replace', path: '/a', value: 10},
			{op: 'add', path: '/c', value: 3},
			{op: 'remove', path: '/b'},
		],
	);
	t.deepEqual(result, {a: 10, c: 3});
});

// --- round-trip ---

test('diff then patch produces the new object', t => {
	const oldObject = {a: 1, b: {c: 2}, d: [1, 2, 3]};
	const newObject = {
		a: 1,
		b: {c: 3},
		d: [1, 2, 4],
		e: 'new',
	};
	const operations = diff(oldObject, newObject);
	const result = patch(oldObject, operations);
	t.deepEqual(result, newObject);
});

test('round-trip with removals', t => {
	const oldObject = {a: 1, b: 2, c: 3};
	const newObject = {a: 1};
	const operations = diff(oldObject, newObject);
	const result = patch(oldObject, operations);
	t.deepEqual(result, newObject);
});

test('round-trip with nested changes', t => {
	const oldObject = {user: {name: 'Alice', age: 30}};
	const newObject = {user: {name: 'Bob', age: 30, email: 'bob@test.com'}};
	const operations = diff(oldObject, newObject);
	const result = patch(oldObject, operations);
	t.deepEqual(result, newObject);
});

// --- no mutation ---

test('patch does not mutate the input object', t => {
	const original = {a: 1, b: {c: 2}};
	const originalCopy = structuredClone(original);
	patch(original, [{op: 'replace', path: '/a', value: 99}]);
	t.deepEqual(original, originalCopy);
});

test('patch does not mutate nested objects', t => {
	const original = {a: {b: 1}};
	const originalCopy = structuredClone(original);
	patch(original, [{op: 'replace', path: '/a/b', value: 99}]);
	t.deepEqual(original, originalCopy);
});

// --- applyPatch alias ---

test('applyPatch is an alias for patch', t => {
	t.is(applyPatch, patch);
});

test('applyPatch works the same as patch', t => {
	const result = applyPatch({a: 1}, [{op: 'replace', path: '/a', value: 2}]);
	t.deepEqual(result, {a: 2});
});

// --- edge cases ---

test('diff with boolean values', t => {
	const result = diff({flag: true}, {flag: false});
	t.deepEqual(result, [{op: 'replace', path: '/flag', value: false}]);
});

test('diff with null values', t => {
	const result = diff({a: null}, {a: 1});
	t.deepEqual(result, [{op: 'replace', path: '/a', value: 1}]);
});

test('patch with empty operations', t => {
	const result = patch({a: 1}, []);
	t.deepEqual(result, {a: 1});
});

test('diff handles mixed additions, removals, and replacements', t => {
	const oldObject = {a: 1, b: 2, c: 3};
	const newObject = {a: 10, c: 3, d: 4};
	const operations = diff(oldObject, newObject);
	const result = patch(oldObject, operations);
	t.deepEqual(result, newObject);
});

test('diff handles arrays with objects', t => {
	const oldObject = {items: [{id: 1, name: 'a'}]};
	const newObject = {items: [{id: 1, name: 'b'}]};
	const operations = diff(oldObject, newObject);
	t.deepEqual(operations, [{op: 'replace', path: '/items/0/name', value: 'b'}]);
});
