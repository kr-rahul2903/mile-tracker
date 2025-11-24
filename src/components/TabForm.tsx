import React, { useState, useEffect } from 'react';
import { User } from '../types';
import { generateDrivingComment } from '../services/gemini';
import { fetchSheetData } from '../services/googleSheets';
import { saveEntryToSupabase, getLastEntryFromSupabase } from '../services/supabase';
import { Sparkles, Save, Loader2, AlertCircle, User as UserIcon, Gauge, FileSpreadsheet } from 'lucide-react';

interface TabFormProps {
  user: User;
  onEntryAdded: () => void;
}

const GOOGLE_FORM_ACTION_URL = "https://docs.google.com/forms/d/e/1FAIpQLSe0TuVWWMbC74sZuV72Pqs9rcZZzFgmw0lj2UofCeECPZC46w/formResponse";

const submitToGoogleForm = async (userName: string, mileage: number, timestamp: number) => {
  // Format date as YYYY-MM-DD HH:mm for Google Forms
  const date = new Date(timestamp);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const formattedDate = `${year}-${month}-${day} ${hours}:${minutes}`;

  const formData = new FormData();
  formData.append('entry.765257113', userName); // User Name
  formData.append('entry.1493291277', mileage.toString()); // Mileage
  formData.append('entry.656566019', formattedDate); // Date and Time

  try {
    await fetch(GOOGLE_FORM_ACTION_URL, {
      method: 'POST',
      mode: 'no-cors', // Essential to bypass CORS since we don't control the server
      body: formData
    });
  } catch (error) {
    console.error("Error submitting to Google Form", error);
  }
};

const TabForm: React.FC<TabFormProps> = ({ user, onEntryAdded }) => {
  const [mileage, setMileage] = useState<string>('');
  const [message, setMessage] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [supabaseSaveStatus, setSupabaseSaveStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle');
  
  // Supabase state
  const [lastSupabaseEntry, setLastSupabaseEntry] = useState<{driver: string, mileage: number} | null>(null);
  const [isLoadingSupabase, setIsLoadingSupabase] = useState(true);

  // Sheet data state
  const [sheetLastEntry, setSheetLastEntry] = useState<{driver: string, mileage: string} | null>(null);
  const [isLoadingSheet, setIsLoadingSheet] = useState(true);

  // Load Supabase Data
  useEffect(() => {
    const loadSupabaseData = async () => {
      setIsLoadingSupabase(true);
      try {
        const lastEntry = await getLastEntryFromSupabase();
        if (lastEntry) {
          setLastSupabaseEntry({
            driver: lastEntry.userName,
            mileage: lastEntry.mileage,
          });
        }
      } catch (e) {
        console.error("Supabase load error", e);
      } finally {
        setIsLoadingSupabase(false);
      }
    };
    loadSupabaseData();
  }, []);

  // Load Sheet Data
  useEffect(() => {
    const loadSheetData = async () => {
      setIsLoadingSheet(true);
      try {
        const { headers, rows } = await fetchSheetData();
        if (rows.length > 0) {
          const lastRow = rows[rows.length - 1];
          
          // Heuristic to find columns based on headers or known structure
          // Defaulting to indices common in Forms: [Timestamp, UserName, Mileage, ...]
          // But looking for headers is safer
          
          const nameIndex = headers.findIndex(h => h.toLowerCase().includes('user') || h.toLowerCase().includes('name'));
          const mileageIndex = headers.findIndex(h => h.toLowerCase().includes('mileage') || h.toLowerCase().includes('1493291277')); // using form ID part just in case
          
          // Fallback to indices 1 and 2 if headers aren't clear (Index 0 is usually Timestamp)
          const driver = (nameIndex !== -1 ? lastRow[nameIndex] : lastRow[1]) || 'Unknown';
          const miles = (mileageIndex !== -1 ? lastRow[mileageIndex] : lastRow[2]) || '0';
          
          setSheetLastEntry({ 
            driver: driver.replace(/^"|"$/g, '').trim(), 
            mileage: miles.replace(/^"|"$/g, '').replace(/,/g, '').trim()
          });
        }
      } catch (e) {
        console.error("Sheet load error", e);
      } finally {
        setIsLoadingSheet(false);
      }
    };
    loadSheetData();
  }, []);

  const handleGenerateMessage = async () => {
    const miles = parseFloat(mileage);
    if (isNaN(miles)) return;

    setIsGenerating(true);
    const aiMessage = await generateDrivingComment(miles);
    setMessage(aiMessage);
    setIsGenerating(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const miles = parseFloat(mileage);
    
    if (isNaN(miles)) {
      setError("Please enter a valid mileage number.");
      return;
    }

    // Validation 1: Check alternation based on Supabase (Primary Source)
    if (lastSupabaseEntry && user.name.toLowerCase() === lastSupabaseEntry.driver.toLowerCase()) {
      setError(`Alternate driver required. The last trip was logged by you (${lastSupabaseEntry.driver}).`);
      return;
    }

    // Validation 2: Check alternation based on Google Sheet Data (Secondary Check)
    if (sheetLastEntry && user.name.toLowerCase() === sheetLastEntry.driver.toLowerCase()) {
      setError(`Alternate driver required. The last entry in the Google Sheet was also by ${sheetLastEntry.driver}. Please wait for the other driver.`);
      return;
    }

    // Validation 3: Check if mileage is less than the last Supabase entry
    if (lastSupabaseEntry && miles < lastSupabaseEntry.mileage) {
      setError(`Mileage cannot be lower than the previous record (${lastSupabaseEntry.mileage.toLocaleString()} miles).`);
      return;
    }
    
    // Validation 4: Check if mileage is less than Sheet last entry
    if (sheetLastEntry) {
      const sheetMiles = parseFloat(sheetLastEntry.mileage);
      if (!isNaN(sheetMiles) && miles < sheetMiles) {
        setError(`Mileage cannot be lower than the Google Sheet record (${sheetMiles.toLocaleString()} miles).`);
        return;
      }
    }

    // Capture precise time of button click as the Start Date of this trip
    const now = Date.now();

    setIsSaving(true);
    
    // Execute Google Form submission and Min Delay concurrently
    const minDelayPromise = new Promise(resolve => setTimeout(resolve, 600));
    const googleFormPromise = submitToGoogleForm(user.name, miles, now);

    await Promise.all([minDelayPromise, googleFormPromise]);

    // Save directly to Supabase with the exact mileage value from input
    setSupabaseSaveStatus('saving');
    try {
      const savedEntry = await saveEntryToSupabase({
        userName: user.name,
        mileage: miles, // Use the exact parsed value
        message: message.trim() || 'No notes provided',
        tripStartDate: now,
      });
      
      setSupabaseSaveStatus('success');
      console.log('Entry saved to Supabase successfully:', savedEntry);
      
      // Update local state with the new entry
      setLastSupabaseEntry({
        driver: savedEntry.userName,
        mileage: savedEntry.mileage,
      });
      
      // Clear success message after 3 seconds
      setTimeout(() => setSupabaseSaveStatus('idle'), 3000);
    } catch (error) {
      setSupabaseSaveStatus('error');
      console.error('Failed to save to Supabase:', error);
      setError('Failed to save entry. Please try again.');
      setIsSaving(false);
      return; // Don't clear form if save failed
    }
    
    setMileage('');
    setMessage('');
    setIsSaving(false);
    onEntryAdded();
  };

  const handleMileageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMileage(e.target.value);
    if (error) setError(null);
  };

  return (
    <div className="max-w-2xl mx-auto bg-white rounded-xl shadow-md p-8 border border-gray-100">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Log New Trip</h2>
      
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3 text-red-700 animate-fadeIn">
          <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <div className="text-sm font-medium">{error}</div>
        </div>
      )}

      {/* Supabase Save Status */}
      {supabaseSaveStatus === 'saving' && (
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg flex items-center gap-3 text-blue-700 animate-fadeIn">
          <Loader2 className="w-5 h-5 animate-spin flex-shrink-0" />
          <div className="text-sm font-medium">Saving to database...</div>
        </div>
      )}
      {supabaseSaveStatus === 'success' && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-3 text-green-700 animate-fadeIn">
          <Save className="w-5 h-5 flex-shrink-0" />
          <div className="text-sm font-medium">Entry saved to database successfully!</div>
        </div>
      )}
      {supabaseSaveStatus === 'error' && (
        <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg flex items-start gap-3 text-yellow-700 animate-fadeIn">
          <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <div className="text-sm font-medium">Entry saved locally, but database save failed. Check console for details.</div>
        </div>
      )}

      {/* Sheet Data Info Block */}
      <div className="mb-6 bg-green-50 rounded-lg p-4 border border-green-100 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-green-100 p-2 rounded-full text-green-700">
             <FileSpreadsheet className="w-4 h-4" />
          </div>
          <div>
            <div className="text-xs text-green-800 font-semibold uppercase tracking-wider">Last Sheet Entry</div>
            {isLoadingSheet ? (
              <div className="h-4 w-24 bg-green-200/50 rounded animate-pulse mt-1"></div>
            ) : sheetLastEntry ? (
              <div className="text-sm text-green-900 font-medium mt-0.5">
                {Number(sheetLastEntry.mileage).toLocaleString()} mi <span className="text-green-600 font-normal">by {sheetLastEntry.driver}</span>
              </div>
            ) : (
              <div className="text-sm text-green-700 italic">No external data found</div>
            )}
          </div>
        </div>
        <div className="text-right">
           {!isLoadingSheet && sheetLastEntry && user.name.toLowerCase() === sheetLastEntry.driver.toLowerCase() && (
             <span className="inline-flex items-center px-2 py-1 rounded text-xs font-bold bg-red-100 text-red-700">
               Wait Your Turn
             </span>
           )}
           {!isLoadingSheet && sheetLastEntry && user.name.toLowerCase() !== sheetLastEntry.driver.toLowerCase() && (
             <span className="inline-flex items-center px-2 py-1 rounded text-xs font-bold bg-green-200 text-green-800">
               Your Turn
             </span>
           )}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Driver
          </label>
          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200 text-gray-700 cursor-not-allowed">
            <div className="bg-blue-100 p-1.5 rounded-full text-blue-600">
              <UserIcon className="h-5 w-5" />
            </div>
            <span className="font-medium">{user.name}</span>
            <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded border border-gray-200 ml-auto">Logged In</span>
          </div>
        </div>

        <div>
          <div className="flex justify-between items-end mb-2">
            <label htmlFor="mileage" className="block text-sm font-medium text-gray-700">
              Odometer Reading
            </label>
            {!isLoadingSupabase && lastSupabaseEntry && (
              <span className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded-md flex items-center gap-1">
                <Gauge className="w-3 h-3" />
                Last: {lastSupabaseEntry.mileage.toLocaleString()} mi
              </span>
            )}
          </div>
          <div className="relative">
            <input
              type="number"
              id="mileage"
              value={mileage}
              onChange={handleMileageChange}
              placeholder={sheetLastEntry ? `e.g. ${Number(sheetLastEntry.mileage) + 10}` : "e.g. 15000"}
              className={`block w-full rounded-lg border p-3 focus:ring-blue-500 focus:border-blue-500 transition shadow-sm outline-none ${
                error ? 'border-red-300 bg-red-50' : 'border-gray-300'
              }`}
              required
            />
            <span className="absolute right-4 top-3.5 text-gray-400 text-sm">miles</span>
          </div>
        </div>

        <div>
          <div className="flex justify-between items-center mb-2">
            <label htmlFor="message" className="block text-sm font-medium text-gray-700">
              Trip Notes <span className="text-gray-400 font-normal">(Optional)</span>
            </label>
            <button
              type="button"
              onClick={handleGenerateMessage}
              disabled={!mileage || isGenerating}
              className={`text-xs flex items-center gap-1 font-medium px-2 py-1 rounded-md transition-colors ${
                !mileage || isGenerating
                  ? 'text-gray-400 bg-gray-100 cursor-not-allowed'
                  : 'text-purple-600 bg-purple-50 hover:bg-purple-100'
              }`}
            >
              {isGenerating ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
              {isGenerating ? 'Thinking...' : 'AI Suggestion'}
            </button>
          </div>
          <textarea
            id="message"
            rows={4}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Details about the trip..."
            className="block w-full rounded-lg border-gray-300 border p-3 focus:ring-blue-500 focus:border-blue-500 transition shadow-sm outline-none resize-none"
          />
        </div>

        <button
          type="submit"
          disabled={isSaving}
          className="w-full flex justify-center items-center gap-2 py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all disabled:opacity-70 disabled:cursor-not-allowed"
        >
          {isSaving ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" /> Saving...
            </>
          ) : (
            <>
              <Save className="w-4 h-4" /> Save Entry
            </>
          )}
        </button>
      </form>
    </div>
  );
};

export default TabForm;