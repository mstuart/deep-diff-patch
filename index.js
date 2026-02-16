function isObject(value) {
	return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function escapeJsonPointer(segment) {
	return String(segment).replaceAll('~', '~0').replaceAll('/', '~1');
}

export function diff(oldObject, newObject, basePath = '') {
	const operations = [];

	if (Array.isArray(oldObject) && Array.isArray(newObject)) {
		const maxLength = Math.max(oldObject.length, newObject.length);
		for (let index = 0; index < maxLength; index++) {
			const path = `${basePath}/${escapeJsonPointer(index)}`;

			if (index >= oldObject.length) {
				operations.push({op: 'add', path, value: newObject[index]});
			} else if (index >= newObject.length) {
				operations.push({op: 'remove', path});
			} else if (isObject(oldObject[index]) && isObject(newObject[index])) {
				operations.push(...diff(oldObject[index], newObject[index], path));
			} else if (Array.isArray(oldObject[index]) && Array.isArray(newObject[index])) {
				operations.push(...diff(oldObject[index], newObject[index], path));
			} else if (oldObject[index] !== newObject[index]) {
				operations.push({op: 'replace', path, value: newObject[index]});
			}
		}

		return operations;
	}

	const oldKeys = Object.keys(oldObject);
	const newKeys = Object.keys(newObject);

	for (const key of newKeys) {
		const path = `${basePath}/${escapeJsonPointer(key)}`;

		if (!(key in oldObject)) {
			operations.push({op: 'add', path, value: newObject[key]});
		} else if (isObject(oldObject[key]) && isObject(newObject[key])) {
			operations.push(...diff(oldObject[key], newObject[key], path));
		} else if (Array.isArray(oldObject[key]) && Array.isArray(newObject[key])) {
			operations.push(...diff(oldObject[key], newObject[key], path));
		} else if (oldObject[key] !== newObject[key]) {
			operations.push({op: 'replace', path, value: newObject[key]});
		}
	}

	for (const key of oldKeys) {
		if (!(key in newObject)) {
			const path = `${basePath}/${escapeJsonPointer(key)}`;
			operations.push({op: 'remove', path});
		}
	}

	return operations;
}

function navigatePath(object, segments) {
	let current = object;
	for (const segment of segments) {
		const key = Array.isArray(current) ? Number(segment) : segment;
		current = current[key];
	}

	return current;
}

function parsePointer(path) {
	return path.split('/').filter(Boolean).map(segment => segment.replaceAll('~1', '/').replaceAll('~0', '~'));
}

export function patch(object, operations) {
	const result = structuredClone(object);

	for (const operation of operations) {
		const segments = parsePointer(operation.path);
		const lastSegment = segments.pop();
		const parent = segments.length === 0 ? result : navigatePath(result, segments);
		const key = Array.isArray(parent) ? Number(lastSegment) : lastSegment;

		switch (operation.op) {
			case 'add':
			case 'replace': {
				parent[key] = operation.value;
				break;
			}

			case 'remove': {
				if (Array.isArray(parent)) {
					parent.splice(key, 1);
				} else {
					delete parent[key];
				}

				break;
			}

			default: {
				break;
			}
		}
	}

	return result;
}

export {patch as applyPatch};
