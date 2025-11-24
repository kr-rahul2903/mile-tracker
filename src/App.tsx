import React, { useState } from 'react';
import { User, Tab } from './types';
import TabForm from './components/TabForm';
import TabList from './components/TabList';
import TabSheet from './components/TabSheet';
import { LayoutDashboard, PlusCircle, LogOut, Car, KeyRound, Lock, User as UserIcon, ArrowRight, ChevronDown, FileSpreadsheet } from 'lucide-react';

// Simulated environment variable access
// In a real app, these would be process.env.SRIKANTH_PIN
const CREDENTIALS: Record<string, string> = {
  'Srikanth': process.env.SRIKANTH_PIN || '2223',
  'Rahul': process.env.RAHUL_PIN || '2113'
};

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>(Tab.ENTRY);
  const [listKey, setListKey] = useState(0);

  // Login State
  const [usernameInput, setUsernameInput] = useState('Srikanth');
  const [pinInput, setPinInput] = useState('');
  const [loginError, setLoginError] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');

    const formattedUsername = usernameInput.trim();
    // Simple case-insensitive match for username, but keys in CREDENTIALS are case-sensitive
    const foundUser = Object.keys(CREDENTIALS).find(
      u => u.toLowerCase() === formattedUsername.toLowerCase()
    );

    if (foundUser && CREDENTIALS[foundUser] === pinInput) {
      setUser({
        id: foundUser.toLowerCase(),
        name: foundUser,
        email: `${foundUser.toLowerCase()}@example.com`,
        photoUrl: ''
      });
      // Do not clear usernameInput to keep it convenient for re-login if needed
      setPinInput('');
    } else {
      setLoginError('Invalid PIN');
    }
  };

  const handleSignOut = () => {
    setUser(null);
    setActiveTab(Tab.ENTRY);
    // Keep the username pre-filled even after sign out, or reset to default
    setUsernameInput('Srikanth'); 
    setPinInput('');
  };

  const handleEntryAdded = () => {
    setListKey(prev => prev + 1);
    setActiveTab(Tab.LIST);
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 relative overflow-hidden">
        {/* Abstract Background Shapes */}
        <div className="absolute top-0 left-0 w-96 h-96 bg-blue-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 -translate-x-1/2 -translate-y-1/2 animate-blob"></div>
        <div className="absolute top-0 right-0 w-96 h-96 bg-purple-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 translate-x-1/2 -translate-y-1/2 animate-blob animation-delay-2000"></div>

        <div className="max-w-md w-full space-y-8 p-10 bg-white rounded-2xl shadow-xl z-10">
          <div className="flex flex-col items-center justify-center text-center">
            <div className="bg-blue-600 p-3 rounded-xl shadow-lg mb-4">
              <Car className="h-10 w-10 text-white" />
            </div>
            <h2 className="mt-2 text-3xl font-extrabold text-gray-900 tracking-tight">
              MileTracker AI
            </h2>
            <p className="mt-2 text-sm text-gray-500">
              Enter your credentials to access the dashboard.
            </p>
          </div>

          <form onSubmit={handleLogin} className="mt-8 space-y-6">
            <div className="space-y-4">
              <div>
                <label htmlFor="username" className="block text-sm font-medium text-gray-700">
                  Username
                </label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <UserIcon className="h-5 w-5 text-gray-400" />
                  </div>
                  <select
                    id="username"
                    name="username"
                    required
                    className="focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 pr-10 sm:text-sm border-gray-300 rounded-lg p-3 border outline-none transition bg-white appearance-none"
                    value={usernameInput}
                    onChange={(e) => setUsernameInput(e.target.value)}
                  >
                    <option value="Srikanth">Srikanth</option>
                    <option value="Rahul">Rahul</option>
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                    <ChevronDown className="h-4 w-4 text-gray-400" />
                  </div>
                </div>
              </div>

              <div>
                <label htmlFor="pin" className="block text-sm font-medium text-gray-700">
                  4-Digit PIN
                </label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <KeyRound className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="pin"
                    name="pin"
                    type="password"
                    inputMode="numeric"
                    maxLength={4}
                    required
                    className="focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-lg p-3 border outline-none transition"
                    placeholder="••••"
                    value={pinInput}
                    onChange={(e) => setPinInput(e.target.value)}
                  />
                </div>
              </div>
            </div>

            {loginError && (
              <div className="text-red-600 text-sm text-center font-medium bg-red-50 p-2 rounded-lg border border-red-100 flex items-center justify-center gap-2">
                 <Lock className="w-4 h-4" /> {loginError}
              </div>
            )}

            <button
              type="submit"
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all shadow-md hover:shadow-lg"
            >
              <span className="absolute left-0 inset-y-0 flex items-center pl-3">
                <Lock className="h-5 w-5 text-blue-500 group-hover:text-blue-400 transition-colors" />
              </span>
              Access Dashboard
              <ArrowRight className="ml-2 h-4 w-4 opacity-70 group-hover:translate-x-1 transition-transform" />
            </button>
          </form>
          
          <div className="text-center">
             <p className="text-xs text-gray-400">
               Default PINs: Srikanth (1234), Rahul (5678)
             </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Navigation Bar */}
      <nav className="bg-white shadow-sm z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center gap-2">
              <div className="bg-blue-600 p-1.5 rounded-lg">
                <Car className="h-6 w-6 text-white" />
              </div>
              <span className="font-bold text-xl text-gray-800 tracking-tight">MileTracker</span>
            </div>
            <div className="flex items-center gap-4">
              <div className="hidden md:flex flex-col items-end mr-2">
                <span className="text-sm font-medium text-gray-900">{user.name}</span>
                <span className="text-xs text-gray-500">Logged In</span>
              </div>
              <div className="h-9 w-9 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold border-2 border-white shadow-sm">
                {user.name.charAt(0)}
              </div>
              <button
                onClick={handleSignOut}
                className="ml-2 p-2 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition"
                title="Sign Out"
              >
                <LogOut className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Dashboard Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="mt-1 text-gray-500">Manage your vehicle logs and view history.</p>
        </div>

        {/* Tab Navigation */}
        <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-1 rounded-xl bg-blue-900/5 p-1 mb-8 max-w-xl">
          <button
            onClick={() => setActiveTab(Tab.ENTRY)}
            className={`flex-1 flex items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-medium leading-5 transition-all
              ${activeTab === Tab.ENTRY
                ? 'bg-white text-blue-700 shadow ring-1 ring-black/5'
                : 'text-gray-600 hover:bg-white/[0.12] hover:text-blue-600'
              }`}
          >
            <PlusCircle size={18} />
            New Entry
          </button>
          <button
            onClick={() => setActiveTab(Tab.LIST)}
            className={`flex-1 flex items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-medium leading-5 transition-all
              ${activeTab === Tab.LIST
                ? 'bg-white text-blue-700 shadow ring-1 ring-black/5'
                : 'text-gray-600 hover:bg-white/[0.12] hover:text-blue-600'
              }`}
          >
            <LayoutDashboard size={18} />
            View History
          </button>
          <button
            onClick={() => setActiveTab(Tab.SHEET)}
            className={`flex-1 flex items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-medium leading-5 transition-all
              ${activeTab === Tab.SHEET
                ? 'bg-white text-blue-700 shadow ring-1 ring-black/5'
                : 'text-gray-600 hover:bg-white/[0.12] hover:text-blue-600'
              }`}
          >
            <FileSpreadsheet size={18} />
            Sheet Data
          </button>
        </div>

        {/* Tab Content */}
        <div className="transition-all duration-300 ease-in-out">
          {activeTab === Tab.ENTRY ? (
            <div className="animate-fadeIn">
              <TabForm user={user} onEntryAdded={handleEntryAdded} />
            </div>
          ) : activeTab === Tab.LIST ? (
            <div className="animate-fadeIn">
              <TabList key={listKey} />
            </div>
          ) : (
            <div className="animate-fadeIn">
              <TabSheet />
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default App;