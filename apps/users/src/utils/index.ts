export const omitKeys = (obj: any, keysToOmit: string) => {
  const { [keysToOmit]: _, ...rest } = obj; // Exclude one key
  return rest;
};

export const getCurrentISODate = () => {
  return new Date().toISOString();
};
