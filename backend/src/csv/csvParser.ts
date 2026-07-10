import Papa from 'papaparse';

/**
 * Parses a CSV file buffer into an array of key-value objects.
 * Handles UTF-8 BOM, greedy empty row stripping, duplicate headers (with suffix),
 * and escapes raw line breaks inside cell values as '\n'.
 */
export const parseCsv = (buffer: Buffer): Array<Record<string, string>> => {
  let csvString = buffer.toString('utf-8');
  
  // Strip UTF-8 BOM if present
  if (csvString.startsWith('\uFEFF')) {
    csvString = csvString.slice(1);
  }

  // Parse as raw 2D array first to handle duplicate headers and clean blank lines
  const parseResult = Papa.parse<string[]>(csvString, {
    header: false,
    skipEmptyLines: 'greedy',
  });

  const rows = parseResult.data;
  if (!rows || rows.length === 0) {
    return [];
  }

  // Deduplicate and clean headers
  const rawHeaders = rows[0].map(h => (h || '').trim());
  const seenHeaders: Record<string, number> = {};
  const cleanHeaders = rawHeaders.map((header) => {
    const baseName = header || 'Column';
    if (seenHeaders[baseName] === undefined) {
      seenHeaders[baseName] = 0;
      return baseName;
    } else {
      seenHeaders[baseName]++;
      return `${baseName}_${seenHeaders[baseName]}`;
    }
  });

  // Construct objects
  const records: Array<Record<string, string>> = [];
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    
    // Skip empty rows
    const isRowEmpty = row.every(val => (val || '').trim() === '');
    if (isRowEmpty) continue;

    const record: Record<string, string> = {};
    for (let j = 0; j < cleanHeaders.length; j++) {
      const rawVal = row[j] !== undefined ? row[j] : '';
      // Escape raw line breaks in cells as \n characters
      const cleanVal = rawVal.replace(/\r?\n/g, '\\n').trim();
      record[cleanHeaders[j]] = cleanVal;
    }
    records.push(record);
  }

  return records;
};

export default parseCsv;
