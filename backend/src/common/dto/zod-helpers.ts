import { z } from 'zod';

// z.coerce.boolean() is a footgun for query-string booleans: it just runs
// JS `Boolean(value)`, so the *string* "false" (any non-empty string) comes
// out `true`. Fine as long as callers only ever omit the param or send
// "true" — breaks the moment something explicitly sends `?flag=false`.
// This parses "true"/"false" (and real booleans, for direct object calls)
// correctly instead.
export const booleanQueryParam = z
  .preprocess((val) => {
    if (typeof val === 'boolean') return val;
    if (val === 'true') return true;
    if (val === 'false') return false;
    return val;
  }, z.boolean())
  .optional();
