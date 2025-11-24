export const SHEET_ID = '1zHSysJyT8OZSczoW27nH_uqamJq0g7euPJWZeHAGs_I';
const SHEET_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv`;

export const parseCSV = (str: string): string[][] => {
  const arr: string[][] = [];
  let quote = false;
  let row = 0, col = 0;

  for (let c = 0; c < str.length; c++) {
      let cc = str[c], nc = str[c+1];
      arr[row] = arr[row] || [];
      arr[row][col] = arr[row][col] || '';

      if (cc === '"' && quote && nc === '"') {
           arr[row][col] += cc; ++c; continue;
      }
      if (cc === '"') {
           quote = !quote; continue;
      }
      if (cc === ',' && !quote) {
           ++col; continue;
      }
      if (cc === '\r' && nc === '\n' && !quote) {
           ++row; col = 0; ++c; continue;
      }
      if (cc === '\n' && !quote) {
           ++row; col = 0; continue;
      }
      if (cc === '\r' && !quote) {
           ++row; col = 0; continue;
      }
      arr[row][col] += cc;
  }
  // Remove empty last row if it exists
  if (arr.length > 0 && arr[arr.length - 1].length === 1 && arr[arr.length - 1][0] === '') {
      arr.pop();
  }
  return arr;
};

export const fetchSheetData = async () => {
  const response = await fetch(SHEET_URL);
  if (!response.ok) {
    throw new Error('Failed to fetch sheet data');
  }
  const csvText = await response.text();
  const parsed = parseCSV(csvText);
  
  return {
    headers: parsed[0] || [],
    rows: parsed.slice(1)
  };
};