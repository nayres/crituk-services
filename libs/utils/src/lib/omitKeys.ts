export const omitKeys = (obj: any, keysToOmit: string) => {
  const { [keysToOmit]: _, ...rest } = obj;
  return rest;
};
