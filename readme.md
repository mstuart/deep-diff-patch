# deep-diff-patch

> Compute a minimal JSON-serializable diff between objects and apply it as a patch

## Install

```sh
npm install deep-diff-patch
```

## Usage

```js
import {diff, patch} from 'deep-diff-patch';

const oldObject = {name: 'Alice', age: 30, city: 'NYC'};
const newObject = {name: 'Alice', age: 31, email: 'alice@test.com'};

const operations = diff(oldObject, newObject);
//=> [
//   {op: 'replace', path: '/age', value: 31},
//   {op: 'add', path: '/email', value: 'alice@test.com'},
//   {op: 'remove', path: '/city'}
// ]

const result = patch(oldObject, operations);
//=> {name: 'Alice', age: 31, email: 'alice@test.com'}
```

## API

### diff(oldObject, newObject, basePath?)

Returns an array of operations describing the changes from `oldObject` to `newObject`.

Each operation has the shape `{op, path, value?}` where:
- `op` is `'add'`, `'remove'`, or `'replace'`
- `path` uses JSON Pointer format ([RFC 6901](https://tools.ietf.org/html/rfc6901)): `/key/nested/0`
- `value` is present for `add` and `replace` operations

Recursively compares nested objects and arrays (by index).

### patch(object, operations)

Applies an array of operations to a deep clone of `object` and returns the new object. The input is never mutated.

### applyPatch(object, operations)

Alias for `patch`.

## Related

- [error-serialize](https://github.com/mstuart/error-serialize) - Serialize/deserialize errors to plain objects

## License

MIT
