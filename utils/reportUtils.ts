import Papa from 'papaparse';

/**
 * Converts an array of objects to a CSV string and triggers a download.
 * @param {string} filename - The desired filename for the downloaded CSV file.
 * @param {Array<object>} data - The array of data to be converted to CSV.
 */
export const exportToCsv = (filename: string, data: Array<object>): void => {
  if (!data || data.length === 0) {
    console.warn("No data provided to export.");
    return;
  }

  const csv = Papa.unparse(data);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  
  const link = document.createElement('a');
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
};
