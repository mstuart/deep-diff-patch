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
  const maxLength = Math.max(oldArray.length, newArray.length);
  for (let index = 0; index < maxLength; index += 1) {
    const path = `${basePath}/${escapeJsonPointer(index)}`;
    const oldValue = oldArray[index];
    const newValue = newArray[index];

    if (index >= oldArray.length) {
      operations.push({ op: "add", path, value: newValue });
    } else if (index >= newArray.length) {
      operations.push({ op: "remove", path });
    } else if (canRecurse(oldValue, newValue)) {
      operations.push(...diff(oldValue, newValue, path));
    } else if (oldValue !== newValue) {
      operations.push({ op: "replace", path, value: newValue });
    }
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
      parent[key] = operation.value;
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
      break;
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
