function hasKey<K extends string>(
  k: K,
  o: unknown,
): o is { [_ in K]: unknown } {
  return typeof o === 'object' && o != null && k in o;
}

export function isNotFoundError(error: unknown) {
  return (
    hasKey('status', error) &&
    typeof error.status === 'number' &&
    error.status === 404
  );
}
