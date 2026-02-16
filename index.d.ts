export type Operation = {
	/**
	The operation type.
	*/
	readonly op: 'add' | 'remove' | 'replace';

	/**
	The JSON Pointer path (RFC 6901).
	*/
	readonly path: string;

	/**
	The value for `add` and `replace` operations.
	*/
	readonly value?: unknown;
};

/**
Compute a minimal diff between two objects.

@param oldObject - The original object.
@param newObject - The new object.
@param basePath - Base path prefix for JSON Pointer paths.
@returns An array of JSON Patch operations.

@example
```
import {diff} from 'deep-diff-patch';

diff({a: 1}, {a: 2});
//=> [{op: 'replace', path: '/a', value: 2}]
```
*/
export function diff(oldObject: Record<string, unknown>, newObject: Record<string, unknown>, basePath?: string): Operation[];

/**
Apply an array of patch operations to an object, returning a new object.

@param object - The object to patch.
@param operations - The array of operations to apply.
@returns A new patched object (input is not mutated).

@example
```
import {patch} from 'deep-diff-patch';

patch({a: 1}, [{op: 'replace', path: '/a', value: 2}]);
//=> {a: 2}
```
*/
export function patch(object: Record<string, unknown>, operations: Operation[]): Record<string, unknown>;

/**
Alias for `patch`.

@param object - The object to patch.
@param operations - The array of operations to apply.
@returns A new patched object (input is not mutated).
*/
export function applyPatch(object: Record<string, unknown>, operations: Operation[]): Record<string, unknown>;
