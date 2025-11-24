import React, { useEffect, useState } from 'react';
import { CarEntry } from '../types';
import { getEntries } from '../services/storage';
import { Car, Clock, User as UserIcon, ArrowRight, TrendingUp, Calendar, Filter } from 'lucide-react';

// Helper to format date as YYYY-MM-DD for input fields (Local time)
const toInputDate = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const TabList: React.FC = () => {
  const [entries, setEntries] = useState<CarEntry[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Initialize date range based on current date logic
  const [dateRange, setDateRange] = useState(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    const day = now.getDate();
    
    let start, end;
    
    // Logic: Default show 15 days data from start of month
    // If current date > 15th, show from 15th to end of month
    if (day <= 15) {
      start = new Date(year, month, 1);
      end = new Date(year, month, 15);
    } else {
      start = new Date(year, month, 15);
      end = new Date(year, month + 1, 0); // Last day of current month
    }
    
    return {
      start: toInputDate(start),
      end: toInputDate(end)
    };
  });

  useEffect(() => {
    // Simulate fetch delay
    setTimeout(() => {
      const data = getEntries();
      // Sort by tripStartDate descending
      data.sort((a, b) => {
         const dateA = a.tripStartDate || (a as any).timestamp || 0;
         const dateB = b.tripStartDate || (b as any).timestamp || 0;
         return dateB - dateA;
      });
      setEntries(data);
      setLoading(false);
    }, 400);
  }, []);

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString();
  };

  // Filter entries based on date range
  const filteredEntries = entries.filter(entry => {
    const entryDate = entry.tripStartDate || (entry as any).timestamp || 0;
    
    // Construct local time boundaries
    const startFilter = new Date(dateRange.start + 'T00:00:00');
    const endFilter = new Date(dateRange.end + 'T23:59:59.999');
    
    return entryDate >= startFilter.getTime() && entryDate <= endFilter.getTime();
  });

  // Calculate totals based on FILTERED entries
  const userTotals = filteredEntries.reduce((acc, entry) => {
    const dist = entry.endMileage ? entry.endMileage - entry.mileage : 0;
    acc[entry.userName] = (acc[entry.userName] || 0) + dist;
    return acc;
  }, {} as Record<string, number>);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (entries.length === 0) {
    return (
      <div className="text-center py-20 bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="bg-gray-50 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
          <Car className="w-8 h-8 text-gray-400" />
        </div>
        <h3 className="text-lg font-medium text-gray-900">No entries found</h3>
        <p className="mt-1 text-gray-500">Get started by adding a new trip in the Entry tab.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Date Filter */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-gray-700 font-medium">
          <Filter className="w-5 h-5 text-blue-600" />
          <span>Filter History</span>
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:flex-none">
            <input
              type="date"
              value={dateRange.start}
              onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
              className="w-full sm:w-auto pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-blue-500 focus:border-blue-500 outline-none text-gray-700"
            />
            <Calendar className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
          </div>
          <span className="text-gray-400">to</span>
          <div className="relative flex-1 sm:flex-none">
            <input
              type="date"
              value={dateRange.end}
              onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
              className="w-full sm:w-auto pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-blue-500 focus:border-blue-500 outline-none text-gray-700"
            />
            <Calendar className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-4">
        {['Srikanth', 'Rahul'].map((name) => (
          <div key={name} className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 relative overflow-hidden transition-all hover:shadow-md">
            <div className="absolute top-0 right-0 p-3 opacity-5">
              <TrendingUp size={48} />
            </div>
            <div className="flex items-center gap-2 mb-2">
              <div className={`w-2 h-2 rounded-full ${name === 'Srikanth' ? 'bg-blue-500' : 'bg-purple-500'}`}></div>
              <span className="text-xs sm:text-sm font-medium text-gray-500 uppercase tracking-wider">{name}</span>
            </div>
            <div className="flex items-baseline gap-1 relative z-10">
              <span className="text-2xl sm:text-3xl font-bold text-gray-900">
                {(userTotals[name] || 0).toLocaleString()}
              </span>
              <span className="text-xs sm:text-sm font-medium text-gray-400">mi</span>
            </div>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
          <h3 className="text-lg leading-6 font-medium text-gray-900">Trip Records</h3>
          <span className="bg-blue-100 text-blue-800 text-xs font-semibold px-2.5 py-0.5 rounded-full">
            {filteredEntries.length} Found
          </span>
        </div>
        
        {filteredEntries.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            No trips found in this date range.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Driver
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Start
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    End
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Distance
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Message
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Trip Time
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredEntries.map((entry) => {
                  // Backward compatibility for legacy data
                  const startDate = entry.tripStartDate || (entry as any).timestamp;
                  const endDate = entry.tripEndDate;
                  const distance = entry.endMileage ? entry.endMileage - entry.mileage : 0;

                  return (
                    <tr key={entry.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-8 w-8 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600">
                            <UserIcon size={16} />
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">{entry.userName}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 font-medium">{entry.mileage.toLocaleString()}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {entry.endMileage ? (
                          <div className="text-sm text-gray-700 font-medium">
                             {entry.endMileage.toLocaleString()}
                          </div>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                            In Progress
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {entry.endMileage ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {distance.toLocaleString()} mi
                          </span>
                        ) : (
                          <span className="text-gray-400 text-sm">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-500 max-w-xs truncate">{entry.message}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div className="flex flex-col">
                          <div className="flex items-center gap-1.5 text-gray-900 font-medium">
                            <Clock size={14} className="text-gray-400" />
                            {formatDate(startDate)}
                          </div>
                          <div className="pl-5 text-xs text-gray-500">
                            {formatTime(startDate)}
                            <ArrowRight size={10} className="inline mx-1 text-gray-300" />
                            {endDate ? formatTime(endDate) : <span className="text-green-600 font-medium">Now</span>}
                          </div>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default TabList;