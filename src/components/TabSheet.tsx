import React, { useEffect, useState } from 'react';
import { FileSpreadsheet, RefreshCw, AlertCircle, ExternalLink, Loader2 } from 'lucide-react';
import { fetchSheetData, SHEET_ID } from '../services/googleSheets';

const VIEW_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/edit`;

const TabSheet: React.FC = () => {
  const [data, setData] = useState<string[][]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const { headers: loadedHeaders, rows: loadedRows } = await fetchSheetData();
      setHeaders(loadedHeaders);
      setData(loadedRows);
    } catch (err) {
      console.error(err);
      setError("Could not load sheet data. Ensure the sheet is public or 'Anyone with the link' can view.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center h-64 text-gray-500">
        <Loader2 className="w-10 h-10 animate-spin mb-4 text-blue-600" />
        <p>Fetching data from Google Sheets...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-8 text-center max-w-lg mx-auto mt-8">
        <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <h3 className="text-lg font-bold text-gray-900 mb-2">Connection Failed</h3>
        <p className="text-gray-600 mb-6">{error}</p>
        <button 
          onClick={loadData}
          className="inline-flex items-center px-4 py-2 bg-white border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <RefreshCw className="w-4 h-4 mr-2" /> Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="bg-green-100 p-2 rounded-lg text-green-700">
            <FileSpreadsheet className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-900">External Sheet Data</h2>
            <p className="text-xs text-gray-500">Live fetch from Google Docs</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
           <a 
            href={VIEW_URL} 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-600 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ExternalLink className="w-4 h-4" /> Open Sheet
          </a>
          <button 
            onClick={loadData}
            className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
          >
            <RefreshCw className="w-4 h-4" /> Refresh
          </button>
        </div>
      </div>

      {/* Data Table */}
      <div className="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden">
        {data.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            <FileSpreadsheet className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p>The sheet appears to be empty.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  {headers.map((header, index) => (
                    <th 
                      key={index} 
                      scope="col" 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap"
                    >
                      {header.replace(/^"|"$/g, '')}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {data.map((row, rowIndex) => (
                  <tr key={rowIndex} className="hover:bg-gray-50 transition-colors">
                    {row.map((cell, cellIndex) => (
                      <td key={cellIndex} className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                        {cell.replace(/^"|"$/g, '')}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      
      <div className="text-center text-xs text-gray-400">
        Showing {data.length} rows from Google Sheet
      </div>
    </div>
  );
};

export default TabSheet;