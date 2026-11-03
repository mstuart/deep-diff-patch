import test from "ava";
import { patch } from "./index.js";

test("replace and remove require an existing own target", (t) => {
  for (const op of ["replace", "remove"]) {
    for (const path of ["/missing", "/toString"]) {
      t.throws(() => patch({}, [{ op, path, value: 1 }]), {
        instanceOf: TypeError,
      });
    }
  }
  t.deepEqual(
    patch({ value: 1 }, [{ op: "replace", path: "/value", value: 2 }]),
    { value: 2 }
  );
});

test("JSON pointers reject invalid tilde escapes", (t) => {
  for (const path of ["/bad~2key", "/trailing~", "/a~x/b"]) {
    t.throws(() => patch({}, [{ op: "add", path, value: 1 }]), {
      instanceOf: TypeError,
    });
  }
  t.deepEqual(patch({}, [{ op: "add", path: "/literal~02", value: 1 }]), {
    "literal~2": 1,
  });
});
