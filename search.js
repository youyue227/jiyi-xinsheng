const indexCache = new WeakMap();

export function normalizeSearch(value) {
  return String(value ?? '').normalize('NFKC').toLowerCase().replace(/[^\p{L}\p{N}]/gu, '');
}

function searchFields(record) {
  if (indexCache.has(record)) return indexCache.get(record);
  const fields = [
    record.searchText, record.id, record.recognitionNote,
    ...(record.brands || []), ...(record.companies || []),
    ...record.products.flatMap(product => [
      product.name, product.primary, product.secondary,
      ...product.materials, ...product.uses,
    ]),
    String(record.year), `${record.year}年`, `第${record.issue}期`, `第${record.page}页`,
    `${record.year}-${record.issue}-${record.page}`,
    `${record.year}年第${record.issue}期第${record.page}页`,
    `${record.year}年${record.issue}期${record.page}页`,
    `${String(record.year).slice(-2)}-${record.issue}`,
    `${String(record.year).slice(-2)}-${record.issue}-${record.page}`,
  ].map(normalizeSearch).filter(Boolean);
  indexCache.set(record, fields);
  return fields;
}

function oneEditApart(first, second) {
  if (Math.abs(first.length - second.length) > 1) return false;
  let i = 0, j = 0, edits = 0;
  while (i < first.length && j < second.length) {
    if (first[i] === second[j]) {
      i++;
      j++;
      continue;
    }
    if (++edits > 1) return false;
    if (first.length >= second.length) i++;
    if (second.length >= first.length) j++;
  }
  return edits + Number(i < first.length || j < second.length) <= 1;
}

function approximateMatch(field, term) {
  // Short terms and catalogue numbers remain literal. Longer words allow one edit.
  if (term.length < 3 || /\d/.test(term)) return false;
  for (let start = 0; start <= field.length - term.length + 1; start++) {
    for (const length of [term.length - 1, term.length, term.length + 1]) {
      if (start + length <= field.length && oneEditApart(field.slice(start, start + length), term)) return true;
    }
  }
  return false;
}

export function createSearchMatcher(query) {
  const terms = [...new Set(String(query ?? '').split(/[\s,，、；;]+/u).map(normalizeSearch).filter(Boolean))];
  if (!terms.length) return () => true;
  return record => {
    const fields = searchFields(record);
    return terms.every(term => fields.some(field => field.includes(term)) ||
      fields.some(field => approximateMatch(field, term)));
  };
}
