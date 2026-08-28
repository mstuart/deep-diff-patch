function isObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function escapeJsonPointer(segment) {
  return String(segment).replaceAll("~", "~0").replaceAll("/", "~1");
}

function canRecurse(oldValue, newValue) {
  return (
    (isObject(oldValue) && isObject(newValue)) ||
    (Array.isArray(oldValue) && Array.isArray(newValue))
  );
}

function diffArrays(oldArray, newArray, basePath) {
  const operations = [];
  const sharedLength = Math.min(oldArray.length, newArray.length);

  // Compare the overlapping prefix and append any new trailing elements.
  for (let index = 0; index < newArray.length; index += 1) {
    const path = `${basePath}/${escapeJsonPointer(index)}`;
    const newValue = newArray[index];

    if (index >= oldArray.length) {
      operations.push({ op: "add", path, value: newValue });
      continue;
    }

    const oldValue = oldArray[index];
    if (canRecurse(oldValue, newValue)) {
      operations.push(...diff(oldValue, newValue, path));
    } else if (oldValue !== newValue) {
      operations.push({ op: "replace", path, value: newValue });
    }
  }

  // Remove trailing elements highest-index-first: each remove splices the
  // array, so ascending order would shift later indices and drop the wrong
  // elements. Descending order keeps every remaining index valid.
  for (let index = oldArray.length - 1; index >= sharedLength; index -= 1) {
    operations.push({
      op: "remove",
      path: `${basePath}/${escapeJsonPointer(index)}`,
    });
  }

  return operations;
}

function diffObjects(oldObject, newObject, basePath) {
  const operations = [];
  const oldKeys = Object.keys(oldObject);
  const newKeys = Object.keys(newObject);

  for (const key of newKeys) {
    const path = `${basePath}/${escapeJsonPointer(key)}`;

    if (Object.hasOwn(oldObject, key)) {
      const oldValue = oldObject[key];
      const newValue = newObject[key];
      if (canRecurse(oldValue, newValue)) {
        operations.push(...diff(oldValue, newValue, path));
      } else if (oldValue !== newValue) {
        operations.push({ op: "replace", path, value: newValue });
      }
    } else {
      operations.push({ op: "add", path, value: newObject[key] });
    }
  }

  for (const key of oldKeys) {
    if (Object.hasOwn(newObject, key)) {
      continue;
    }

    const path = `${basePath}/${escapeJsonPointer(key)}`;
    operations.push({ op: "remove", path });
  }

  return operations;
}

export function diff(oldObject, newObject, basePath = "") {
  if (Array.isArray(oldObject) && Array.isArray(newObject)) {
    return diffArrays(oldObject, newObject, basePath);
  }

  return diffObjects(oldObject, newObject, basePath);
}

function navigatePath(object, segments) {
  let current = object;
  for (const segment of segments) {
    const key = Array.isArray(current) ? Number(segment) : segment;
    if (!Object.hasOwn(current, key)) {
      throw new TypeError(
        `Cannot navigate through non-own property: ${segment}`
      );
    }

    current = current[key];
  }

  return current;
}

function parsePointer(path) {
  return path
    .split("/")
    .filter(Boolean)
    .map((segment) => segment.replaceAll("~1", "/").replaceAll("~0", "~"));
}

function applyOperation(parent, key, operation) {
  switch (operation.op) {
    case "add":
    case "replace": {
      if (key === "__proto__") {
        Object.defineProperty(parent, key, {
          configurable: true,
          enumerable: true,
          value: operation.value,
          writable: true,
        });
      } else {
        parent[key] = operation.value;
      }

      break;
    }

    case "remove": {
      if (Array.isArray(parent)) {
        parent.splice(key, 1);
      } else {
        delete parent[key];
      }

      break;
    }

    default: {
      throw new TypeError(`Unsupported patch operation: ${operation.op}`);
    }
  }
}

export function patch(object, operations) {
  const result = structuredClone(object);

  for (const operation of operations) {
    const segments = parsePointer(operation.path);
    const lastSegment = segments.pop();
    const parent =
      segments.length === 0 ? result : navigatePath(result, segments);
    const key = Array.isArray(parent) ? Number(lastSegment) : lastSegment;

    applyOperation(parent, key, operation);
  }

  return result;
}

export { patch as applyPatch };
