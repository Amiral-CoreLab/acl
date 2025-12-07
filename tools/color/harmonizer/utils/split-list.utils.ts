export const splitListUtils = <T>(list: T[], parts: number): T[][] => {
  if (parts < 2) {
    return [list];
  }

  const result: T[][] = [];
  const base = Math.floor(list.length / parts);
  let remainder = list.length % parts;
  let start = 0;

  for (let i = 0; i < parts; i += 1) {
    const size = base + (remainder > 0 ? 1 : 0);
    remainder -= remainder > 0 ? 1 : 0;

    result.push(list.slice(start, start + size));
    start += size;
  }

  return result;
};
