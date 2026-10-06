import { expectError, expectType } from "tsd";
import { applyPatch, diff, type Operation, patch } from "./index.js";

expectType<Operation[]>(diff({ a: 1 }, { a: 2 }));
expectType<Operation[]>(diff({}, { a: 1 }));
expectType<Operation[]>(diff({ a: 1 }, {}));

expectType<Record<string, unknown>>(
  patch({ a: 1 }, [{ op: "replace", path: "/a", value: 2 }])
);
expectType<Record<string, unknown>>(
  applyPatch({ a: 1 }, [{ op: "add", path: "/b", value: 3 }])
);

expectError(diff("not an object", {}));
expectError(patch("not an object", []));

expectType<Operation[]>(diff([1, 2], [1]));
expectType<unknown[]>(patch([1, 2], [{ op: "remove", path: "/1" }]));
expectType<unknown[]>(applyPatch([1], [{ op: "add", path: "/-", value: 2 }]));
const readonlyArray = [1, 2] as const;
expectType<Operation[]>(diff(readonlyArray, [1]));
expectType<unknown[]>(patch(readonlyArray, []));
