import React, { useState, useEffect, useMemo } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, signInWithCustomToken } from 'firebase/auth';
import { getFirestore, collection, doc, setDoc, getDocs, onSnapshot, updateDoc, writeBatch } from 'firebase/firestore'; 

// Standard Lucide Icons
const IconUsers = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>;
const IconShield = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>;
const IconDownload = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>;
const IconSearch = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" x2="16.65" y1="21" y2="16.65"/></svg>;
const IconCopy = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>;
const IconCheck = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>;
const IconLogOut = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" x2="9" y1="12" y2="12"/></svg>;
const IconUpload = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" x2="12" y1="3" y2="15"/></svg>;
const IconEdit = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>;
const IconPlus = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>;
const IconAlertTriangle = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>;

// Definitions extracted verbatim from "WSCCA Affirmed Divisions.pdf"
const WSCCA_DIVISIONS = {
  "Varsity": {
    "Tumbling": ["Small", "Medium", "Large", "Coed"],
    "Non-Tumbling": ["Small", "Medium", "Large", "Coed"],
    "Game Day": ["Small", "Medium", "Large", "Coed"],
    "Stomp": ["All Girl", "Coed"]
  },
  "JV": {
    "Tumbling": ["All Girl", "Coed"],
    "Non-Tumbling": ["All Girl", "Coed"],
    "Game Day": ["All Girl", "Coed"],
    "Stomp": ["All Girl", "Coed"]
  },
  "MS/Jr High": {
    "Tumbling": ["All Girl", "Coed"],
    "Non-Tumbling": ["All Girl", "Coed"],
    "Game Day": ["All Girl", "Coed"],
    "Stomp": ["All Girl", "Coed"]
  },
  "Rec": {
    "Tumbling": ["8Y", "10Y", "12Y", "14Y", "10-18Y"],
    "Non-Tumbling": ["8Y", "10Y", "12Y", "14Y", "10-18Y"],
    "Game Day": ["8Y", "10Y", "12Y", "14Y", "10-18Y", "Combined 8-12Y", "Combined 14-18Y"],
    "Stomp": ["Rec Stomp"]
  }
};

const appId = typeof __app_id !== 'undefined' ? __app_id : 'wscja-email-registry-demo';
const firebaseConfig = typeof __firebase_config !== 'undefined' ? JSON.parse(__firebase_config) : {};

let app, auth, db;
try {
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getFirestore(app);
} catch (e) {
  console.error("Firebase init error", e);
}

const INITIAL_DATABASE = [];

const Modal = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
          <h3 className="font-semibold text-gray-800">{title}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">&times;</button>
        </div>
        <div className="p-6 max-h-[80vh] overflow-y-auto">{children}</div>
      </div>
    </div>
  );
};

// Reusable dynamic cascading dropdown form
const TeamDetailsForm = ({ teamForm, setTeamForm }) => {
  const availableTypes = Object.keys(WSCCA_DIVISIONS);
  const availableCategories = teamForm.teamType ? Object.keys(WSCCA_DIVISIONS[teamForm.teamType]) : [];
  const availableDivisions = teamForm.category && teamForm.teamType && WSCCA_DIVISIONS[teamForm.teamType][teamForm.category] 
    ? WSCCA_DIVISIONS[teamForm.teamType][teamForm.category] 
    : [];

  return (
    <div className="space-y-4">
      {teamForm.teamType === 'Varsity' && (
        <div className="bg-sky-50 border-l-4 border-sky-500 p-3 rounded-r-lg text-xs text-sky-800">
          <strong>Naming Convention Note:</strong> Varsity programs should be listed with just the program/school name without "High School" after it (e.g., <em>"Renton"</em> rather than <em>"Renton High School"</em>).
        </div>
      )}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Team Type</label>
        <select required className="w-full p-3 border border-gray-300 rounded-xl bg-white focus:ring-2 focus:ring-blue-500" 
          value={teamForm.teamType} 
          onChange={(e) => setTeamForm({...teamForm, teamType: e.target.value, category: '', division: ''})}
        >
          <option value="">Select Type...</option>
          {availableTypes.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
      </div>
      {teamForm.teamType && (
        <div className="animate-fade-in">
          <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
          <select required className="w-full p-3 border border-gray-300 rounded-xl bg-white focus:ring-2 focus:ring-blue-500" 
            value={teamForm.category} 
            onChange={(e) => setTeamForm({...teamForm, category: e.target.value, division: ''})}
          >
            <option value="">Select Category...</option>
            {availableCategories.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
      )}
      {teamForm.category && (
        <div className="animate-fade-in">
          <label className="block text-sm font-medium text-gray-700 mb-1">Division</label>
          <select required className="w-full p-3 border border-gray-300 rounded-xl bg-white focus:ring-2 focus:ring-blue-500" 
            value={teamForm.division} 
            onChange={(e) => setTeamForm({...teamForm, division: e.target.value})}
          >
            <option value="">Select Division...</option>
            {availableDivisions.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
        </div>
      )}
    </div>
  );
};

const CoachPortal = ({ programs, onLogin, loggedInProgram, onLogout, updateEmail, createProgram, updateProgramDetails }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  
  const [newEmail, setNewEmail] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // State for creating new programs / editing details
  const [isCreatingTeam, setIsCreatingTeam] = useState(false);
  const [isEditingDetails, setIsEditingDetails] = useState(false);
  const [teamForm, setTeamForm] = useState({ teamName: '', teamType: '', category: '', division: '', adEmail: '', coachEmail: '', pin: '' });

  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const query = searchQuery.toLowerCase();
    return programs.filter(p => 
      p.teamName.toLowerCase().includes(query) || 
      p.teamType.toLowerCase().includes(query) || 
      p.category.toLowerCase().includes(query) ||
      (p.division && p.division.toLowerCase().includes(query))
    ).slice(0, 8);
  }, [searchQuery, programs]);

  const handleLogin = (e) => {
    e.preventDefault();
    if (selectedTeam && selectedTeam.pin === pin) {
      onLogin(selectedTeam);
      setNewEmail(selectedTeam.coachEmail || selectedTeam.adEmail);
      setError('');
    } else {
      setError('Invalid PIN for this program.');
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await updateEmail(loggedInProgram.id, newEmail);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      console.error(err);
      alert("Failed to save. Please try again.");
    }
    setIsSaving(false);
  };

  const handleCreateTeamSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    setError('');

    const duplicateProfile = programs.find(p => 
      p.teamName.toLowerCase().trim() === teamForm.teamName.toLowerCase().trim() &&
      p.teamType === teamForm.teamType &&
      p.category === teamForm.category &&
      p.division === teamForm.division
    );

    if (duplicateProfile) {
      setError(`A profile already exists for ${teamForm.teamName} (${teamForm.division} ${teamForm.teamType} ${teamForm.category}). Please go back to the search page and log into your existing profile to prevent duplicates.`);
      setIsSaving(false);
      return;
    }

    try {
      const newTeam = await createProgram(teamForm);
      setIsCreatingTeam(false);
      onLogin(newTeam);
      setNewEmail(newTeam.coachEmail || newTeam.adEmail);
    } catch (err) {
      setError('Failed to securely register program. Please try again.');
    }
    setIsSaving(false);
  };

  const handleUpdateDetailsSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    setError('');

    const duplicateProfile = programs.find(p => 
      p.id !== loggedInProgram.id &&
      p.teamName.toLowerCase().trim() === loggedInProgram.teamName.toLowerCase().trim() &&
      p.teamType === teamForm.teamType &&
      p.category === teamForm.category &&
      p.division === teamForm.division
    );

    if (duplicateProfile) {
      alert('Cannot update. A separate profile already exists for this exact division and category.');
      setIsSaving(false);
      return;
    }

    try {
      await updateProgramDetails(loggedInProgram.id, {
        teamType: teamForm.teamType,
        category: teamForm.category,
        division: teamForm.division
      });
      setIsEditingDetails(false);
    } catch (err) {
      console.error(err);
      alert('Failed to update details');
    }
    setIsSaving(false);
  };

  const openEditDetailsModal = () => {
    setTeamForm({
        ...teamForm,
        teamName: loggedInProgram.teamName,
        teamType: loggedInProgram.teamType || '',
        category: loggedInProgram.category || '',
        division: loggedInProgram.division || ''
    });
    setIsEditingDetails(true);
  };

  if (loggedInProgram) {
    return (
      <div className="max-w-2xl mx-auto mt-4 sm:mt-8 animate-fade-in px-2 sm:px-0">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="bg-blue-600 p-4 sm:p-6 text-white flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 sm:gap-0">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold">{loggedInProgram.teamName}</h2>
              <div className="flex items-center gap-2 mt-1">
                <p className="text-blue-100 text-sm sm:text-base">{loggedInProgram.division} • {loggedInProgram.teamType} • {loggedInProgram.category}</p>
                <button onClick={openEditDetailsModal} className="text-blue-200 hover:text-white transition-colors bg-blue-700/50 p-1.5 rounded-md" title="Update Division/Category">
                  <IconEdit />
                </button>
              </div>
            </div>
            <button onClick={onLogout} className="flex items-center gap-2 bg-blue-700 hover:bg-blue-800 px-4 py-2 rounded-lg transition-colors text-sm font-medium w-full sm:w-auto justify-center shrink-0">
              <IconLogOut /> Logout
            </button>
          </div>
          
          <div className="p-4 sm:p-8">
            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-4 rounded-r-lg">
              <h3 className="font-semibold text-yellow-800 text-sm uppercase tracking-wide">Important Rule</h3>
              <p className="text-yellow-700 text-sm mt-1">
                The <strong>SAME ONE</strong> email address below will be used to deliver BOTH the penalty form (within 30 mins) and the scoresheet package (within 2 hours). If you need a SUB for one week, update this email now, and log back in next week to revert it.
              </p>
            </div>

            <div className="bg-orange-50 border-l-4 border-orange-500 p-4 mb-8 rounded-r-lg">
              <h3 className="font-semibold text-orange-800 text-sm uppercase tracking-wide">Late Update Warning</h3>
              <p className="text-orange-700 text-sm mt-1">
                Do <strong>NOT</strong> use this form to change an email address within <strong>3 days</strong> of your event without also emailing the change to <a href="mailto:wscjascorekeeper@gmail.com" className="underline font-semibold">wscjascorekeeper@gmail.com</a>. Failure to do so may result in penalty form and score sheet delivery to the last email address on file.
              </p>
            </div>

            <form onSubmit={handleUpdate} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Scoresheet Delivery Email Address
                </label>
                <input 
                  type="email" 
                  required
                  className="w-full p-3 sm:p-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-base sm:text-lg"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                />
              </div>

              <div className="bg-gray-50 p-3 sm:p-4 rounded-xl border border-gray-100 text-xs sm:text-sm text-gray-600 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 sm:gap-0">
                <span className="break-all"><strong>Fallback (AD):</strong> {loggedInProgram.adEmail}</span>
                <span className="text-gray-400 shrink-0">Updated: {new Date(loggedInProgram.lastUpdated).toLocaleDateString()}</span>
              </div>

              <button 
                type="submit" 
                disabled={isSaving}
                className={`w-full py-4 rounded-xl text-white font-semibold text-lg transition-all flex items-center justify-center gap-2 ${saveSuccess ? 'bg-green-500 hover:bg-green-600' : 'bg-blue-600 hover:bg-blue-700'}`}
              >
                {saveSuccess ? <><IconCheck /> Saved Successfully</> : 'Update Email Address'}
              </button>
            </form>
          </div>
        </div>

        <Modal isOpen={isEditingDetails} onClose={() => setIsEditingDetails(false)} title="Update Program Details">
          <form onSubmit={handleUpdateDetailsSubmit} className="space-y-6">
            <div className="bg-blue-50 text-blue-800 p-3 rounded-lg text-sm mb-4">
               Update your team's division, type, or category based on the <strong>"WSCCA Affirmed Divisions.pdf"</strong>.
            </div>
            
            <TeamDetailsForm teamForm={teamForm} setTeamForm={setTeamForm} />
            
            <button type="submit" disabled={isSaving} className="w-full bg-blue-600 text-white py-3 rounded-xl font-medium hover:bg-blue-700 transition-colors disabled:opacity-50">
              {isSaving ? 'Saving...' : 'Save Updated Details'}
            </button>
          </form>
        </Modal>

      </div>
    );
  }

  if (isCreatingTeam) {
    return (
      <div className="max-w-md mx-auto mt-6 sm:mt-12 animate-fade-in px-2 sm:px-0">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Register New Program</h2>
          <p className="text-gray-500 mt-2 text-sm">Create your team profile for the first time this season.</p>
        </div>
        <div className="bg-white p-4 sm:p-8 rounded-2xl shadow-sm border border-gray-200">
          <form onSubmit={handleCreateTeamSubmit} className="space-y-5">
            <div className="flex items-center justify-between mb-4">
              <button type="button" onClick={() => setIsCreatingTeam(false)} className="text-sm text-blue-600 hover:underline flex items-center gap-1">&larr; Back to Search</button>
            </div>
            
            {error && (
              <div className="bg-red-50 text-red-700 border border-red-200 p-4 rounded-xl text-sm flex gap-3 items-start shadow-sm">
                <div className="mt-0.5 text-red-500"><IconAlertTriangle /></div>
                <div>
                  <strong className="block mb-1 font-semibold">Duplicate Entry Blocked</strong>
                  {error}
                </div>
              </div>
            )}
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Program Name <span className="text-xs text-gray-400 font-normal">(Locked to match WIAA database)</span></label>
              <input type="text" required className="w-full p-3 border border-gray-300 rounded-xl bg-gray-50 text-gray-600 font-medium cursor-not-allowed" value={teamForm.teamName} readOnly />
              <p className="text-xs text-gray-400 mt-1">Carried over from search query. Names cannot be changed to preserve WIAA alignment (e.g., W.F. West).</p>
            </div>

            <TeamDetailsForm teamForm={teamForm} setTeamForm={setTeamForm} />

            <div className="pt-4 border-t border-gray-100">
              <label className="block text-sm font-medium text-gray-700 mb-1">Primary Coach Email</label>
              <input type="email" required className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500" placeholder="coach@example.com" value={teamForm.coachEmail} onChange={e => setTeamForm({...teamForm, coachEmail: e.target.value})} />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">AD / Director Email (Fallback)</label>
              <input type="email" required className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500" placeholder="director@example.com" value={teamForm.adEmail} onChange={e => setTeamForm({...teamForm, adEmail: e.target.value})} />
            </div>

            <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 mt-4">
              <label className="block text-sm font-medium text-gray-900 mb-1">Set a Secure PIN</label>
              <p className="text-xs text-gray-500 mb-2">You will use this PIN to log in throughout the season to verify/update your email.</p>
              <input type="password" required className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500" placeholder="Choose a PIN" value={teamForm.pin} onChange={e => setTeamForm({...teamForm, pin: e.target.value})} />
            </div>

            <button type="submit" disabled={isSaving} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-4 rounded-xl transition-colors mt-6 shadow-sm">
              {isSaving ? 'Creating...' : 'Register Program & Login'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto mt-6 sm:mt-12 animate-fade-in px-2 sm:px-0">
      <div className="text-center mb-6 sm:mb-8">
        <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">Program Login</h2>
        <p className="text-gray-500 mt-2 text-sm sm:text-base">Find your team to update delivery contacts</p>
      </div>

      <div className="bg-white p-4 sm:p-8 rounded-2xl shadow-sm border border-gray-200">
        {!selectedTeam ? (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Search for your program</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                  <IconSearch />
                </div>
                <input 
                  type="text" 
                  className="w-full pl-10 p-3 sm:p-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 transition-all text-base"
                  placeholder="Enter team name or keywords..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  autoFocus
                />
              </div>
            </div>

            {searchQuery.trim() === '' ? (
              <div className="mt-6 pt-4 border-t border-gray-100 animate-fade-in">
                <div className="bg-blue-50 border border-blue-100 p-4 rounded-xl flex gap-3 text-sm text-blue-800 items-start">
                  <div className="mt-0.5 shrink-0"><IconUsers /></div>
                  <p>
                    <strong>Duplicate Prevention Policy:</strong> You are required to search for your program above before creating a new entry. Your profile from last year has likely rolled over!
                  </p>
                </div>
              </div>
            ) : (
              <div className="mt-4 space-y-2 animate-fade-in">
                <div className="max-h-[50vh] overflow-y-auto space-y-2 pb-2">
                  {searchResults.length > 0 ? (
                    searchResults.map(team => (
                      <button 
                        key={team.id}
                        onClick={() => setSelectedTeam(team)}
                        className="w-full text-left p-4 rounded-xl border border-gray-100 hover:border-blue-500 hover:bg-blue-50 transition-all group shadow-sm"
                      >
                        <h4 className="font-bold text-gray-900 group-hover:text-blue-700">{team.teamName}</h4>
                        <p className="text-xs sm:text-sm text-gray-500 mt-1">
                          {team.division} • {team.teamType} • {team.category}
                        </p>
                      </button>
                    ))
                  ) : (
                    <div className="text-center p-6 text-gray-500 text-sm bg-gray-50 rounded-xl border border-dashed border-gray-200">
                      No programs found matching "{searchQuery}".
                    </div>
                  )}
                </div>

                <div className="pt-4 border-t border-gray-100 text-center animate-fade-in">
                  <p className="text-sm text-gray-500 mb-3">Not seeing your exact team division after searching?</p>
                  <button 
                    type="button"
                    onClick={() => {
                       setTeamForm({ teamName: searchQuery, teamType: '', category: '', division: '', adEmail: '', coachEmail: '', pin: '' });
                       setIsCreatingTeam(true);
                    }}
                    className="inline-flex items-center justify-center gap-2 w-full p-3 rounded-xl border-2 border-dashed border-gray-300 text-gray-600 hover:border-blue-500 hover:text-blue-600 hover:bg-blue-50 transition-all font-medium"
                  >
                    <IconPlus /> Register New Program
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <form onSubmit={handleLogin} className="space-y-5 animate-fade-in">
            <div className="flex items-center justify-between mb-2">
              <button 
                type="button" 
                onClick={() => { setSelectedTeam(null); setPin(''); setError(''); }}
                className="text-sm text-blue-600 hover:underline flex items-center gap-1"
              >
                &larr; Back to Search
              </button>
            </div>

            <div className="p-4 bg-gray-50 rounded-xl border border-gray-100 mb-4 shadow-inner">
              <h3 className="font-bold text-gray-900">{selectedTeam.teamName}</h3>
              <p className="text-sm text-gray-500">{selectedTeam.division} • {selectedTeam.teamType} • {selectedTeam.category}</p>
            </div>

            {error && <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm border border-red-100">{error}</div>}
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Program PIN</label>
              <input 
                type="password" 
                className="w-full p-3 sm:p-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 text-lg shadow-sm"
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                placeholder="Enter PIN (Hint: 1234)"
                required
              />
            </div>

            <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 sm:py-4 rounded-xl transition-colors text-lg shadow-sm">
              Secure Login
            </button>

            <div className="text-center mt-4">
              <button type="button" onClick={() => setIsResetModalOpen(true)} className="text-sm text-gray-500 hover:text-blue-600 hover:underline">
                First time this season? Set / Reset PIN
              </button>
            </div>
          </form>
        )}
      </div>

      <Modal isOpen={isResetModalOpen} onClose={() => setIsResetModalOpen(false)} title="Set / Reset Program PIN">
        <p className="text-gray-600 text-sm mb-4">
          For security reasons, if you are setting up your team for the first time this season or need to reset your PIN, a secure link will be sent to the Athletic Director/Director email on file for <strong>{selectedTeam?.teamName}</strong>.
        </p>
        <button 
          onClick={() => {
            alert(`In a production environment, a reset email would now be sent to ${selectedTeam?.adEmail}`);
            setIsResetModalOpen(false);
          }}
          className="w-full bg-gray-900 text-white py-3 sm:py-4 rounded-xl font-medium hover:bg-black transition-colors"
        >
          Send Reset Link to AD
        </button>
      </Modal>
    </div>
  );
};

const AdminLogin = ({ onLogin }) => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (password === 'SK2026!') {
      onLogin();
    } else {
      setError('Invalid admin password.');
    }
  };

  return (
    <div className="max-w-md mx-auto mt-12 animate-fade-in">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-900">Scorekeeper Login</h2>
        <p className="text-gray-500 mt-2">Authorized WSCJA personnel only</p>
      </div>
      <form onSubmit={handleSubmit} className="bg-white p-8 rounded-2xl shadow-sm border border-gray-200 space-y-5">
        {error && <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm">{error}</div>}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Admin Password</label>
          <input 
            type="password" 
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter admin password"
            required
          />
        </div>
        <button type="submit" className="w-full bg-gray-900 hover:bg-black text-white font-semibold py-3 rounded-lg transition-colors">
          Access Dashboard
        </button>
      </form>
    </div>
  );
};

const AdminPortal = ({ programs, onLogout, updateEmail }) => {
  const [activeTab, setActiveTab] = useState('lookup');
  const [lookupType, setLookupType] = useState('');
  const [lookupCategory, setLookupCategory] = useState('');
  const [lookupTeamId, setLookupTeamId] = useState('');
  const [copied, setCopied] = useState(false);
  
  const [isEditingEmail, setIsEditingEmail] = useState(false);
  const [editEmailValue, setEditEmailValue] = useState('');
  const [adminSearchQuery, setAdminSearchQuery] = useState('');
  
  const [importMessage, setImportMessage] = useState(null);
  const [isImporting, setIsImporting] = useState(false);
  const fileInputRef = React.useRef(null);

  const types = [...new Set(programs.map(p => p.teamType))].sort();
  const categories = [...new Set(programs.filter(p => p.teamType === lookupType).map(p => p.category))].sort();
  const availableTeams = programs.filter(p => p.teamType === lookupType && p.category === lookupCategory).sort((a, b) => a.teamName.localeCompare(b.teamName));
  const selectedTeam = programs.find(p => p.id === lookupTeamId);

  const activeEmail = selectedTeam ? (selectedTeam.coachEmail || selectedTeam.adEmail) : '';

  useEffect(() => {
    setIsEditingEmail(false);
    if (selectedTeam) {
        setEditEmailValue(selectedTeam.coachEmail || selectedTeam.adEmail);
    }
  }, [selectedTeam]);

  const adminSearchResults = useMemo(() => {
    if (!adminSearchQuery.trim()) return [];
    const query = adminSearchQuery.toLowerCase();
    return programs.filter(p => 
      p.teamName.toLowerCase().includes(query) || 
      (p.division && p.division.toLowerCase().includes(query))
    ).slice(0, 6);
  }, [adminSearchQuery, programs]);

  const handleSaveEmail = async () => {
    if (selectedTeam) {
      await updateEmail(selectedTeam.id, editEmailValue);
      setIsEditingEmail(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(activeEmail).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleExportCSV = () => {
    const headers = ['Team Type', 'Category', 'Division', 'Team Name', 'Primary Delivery Email', 'AD Email (Fallback)', 'Last Updated'];
    const rows = programs.map(p => [
      p.teamType, 
      p.category, 
      p.division || '',
      `"${p.teamName}"`, 
      p.coachEmail || p.adEmail, 
      p.adEmail, 
      new Date(p.lastUpdated).toLocaleDateString()
    ]);
    
    let csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `WSCJA_Emails_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    setIsImporting(true);
    setImportMessage(null);

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const text = e.target.result;
        const lines = text.split(/\r?\n/).filter(line => line.trim());
        if (lines.length < 2) {
          setImportMessage({ type: 'error', text: 'Invalid CSV format or empty file.' });
          setIsImporting(false);
          return;
        }

        const parseRow = (str) => {
          let arr = [], quote = false, cell = '';
          for (let c = 0; c < str.length; c++) {
            let char = str[c];
            if (char === '"' && str[c+1] === '"') { cell += '"'; c++; }
            else if (char === '"') { quote = !quote; }
            else if (char === ',' && !quote) { arr.push(cell.trim()); cell = ''; }
            else { cell += char; }
          }
          arr.push(cell.trim());
          return arr;
        }

        const headers = parseRow(lines[0]).map(h => h.toLowerCase().replace(/[^a-z0-9]/g, ''));
        
        const map = {
          name: headers.findIndex(h => h.includes('name') || h.includes('program') || h.includes('school')),
          type: headers.findIndex(h => h.includes('type')),
          category: headers.findIndex(h => h.includes('category')),
          division: headers.findIndex(h => h.includes('division') || h.includes('class')),
          coachEmail: headers.findIndex(h => h.includes('coach') && h.includes('email')),
          adEmail: headers.findIndex(h => (h.includes('ad') || h.includes('director')) && h.includes('email')),
        };

        const batch = writeBatch(db);
        let count = 0;
        
        for (let i = 1; i < lines.length; i++) {
           const row = parseRow(lines[i]);
           if (row.length < 2) continue;
           
           const teamName = map.name >= 0 && row[map.name] ? row[map.name] : `Imported Team ${i}`;
           const teamType = map.type >= 0 && row[map.type] ? row[map.type] : 'High School';
           const category = map.category >= 0 && row[map.category] ? row[map.category] : 'Cheer';
           const division = map.division >= 0 && row[map.division] ? row[map.division] : '';
           const coachEmail = map.coachEmail >= 0 && row[map.coachEmail] ? row[map.coachEmail] : '';
           const adEmail = map.adEmail >= 0 && row[map.adEmail] ? row[map.adEmail] : '';
           
           const id = `${teamName}-${teamType}-${category}-${division}`.toLowerCase().replace(/[^a-z0-9]/g, '-');
           
           const docRef = doc(db, 'artifacts', appId, 'public', 'data', 'programs', id);
           batch.set(docRef, {
             id, teamName, teamType, category, division, coachEmail, adEmail,
             pin: '1234',
             lastUpdated: Date.now()
           });
           count++;
        }
        await batch.commit();
        setImportMessage({ type: 'success', text: `Successfully imported ${count} programs from the CSV!` });
      } catch (err) {
        console.error("Import error", err);
        setImportMessage({ type: 'error', text: 'Error importing database. Ensure the CSV is valid.' });
      }
      setIsImporting(false);
      event.target.value = '';
    };
    reader.readAsText(file);
  };

  return (
    <div className="max-w-6xl mx-auto mt-8 animate-fade-in">
      <div className="flex justify-between items-end mb-6">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Scorekeeper Dashboard</h2>
          <p className="text-gray-500 mt-1">Access the master database and verify active emails</p>
        </div>
        <div className="flex flex-col items-end gap-3">
          <button onClick={onLogout} className="flex items-center gap-2 text-gray-500 hover:text-gray-700 transition-colors text-sm font-medium">
            <IconLogOut /> Secure Logout
          </button>
          <div className="flex bg-gray-100 p-1 rounded-lg">
            <button 
              onClick={() => setActiveTab('lookup')}
              className={`px-4 py-2 rounded-md font-medium text-sm transition-all ${activeTab === 'lookup' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
            >
              Lookup Tool
            </button>
            <button
              onClick={() => setActiveTab('database')}
              className={`px-4 py-2 rounded-md font-medium text-sm transition-all ${activeTab === 'database' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
            >
              Master Database
            </button>
          </div>
        </div>
      </div>

      {activeTab === 'lookup' && (
        <div className="grid md:grid-cols-2 gap-4 sm:gap-8">
          <div className="bg-white p-4 sm:p-6 rounded-2xl shadow-sm border border-gray-200">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2"><IconSearch /> Find a Team</h3>
            
            <div className="mb-6 relative">
               <label className="block text-sm font-medium text-gray-700 mb-1">Quick Search</label>
               <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                    <IconSearch />
                  </div>
                  <input 
                    type="text" 
                    className="w-full pl-10 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Search program name..."
                    value={adminSearchQuery}
                    onChange={(e) => setAdminSearchQuery(e.target.value)}
                  />
               </div>
               {adminSearchQuery && (
                 <div className="absolute z-20 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                   {adminSearchResults.length > 0 ? adminSearchResults.map(team => (
                      <button 
                        key={team.id}
                        className="w-full text-left p-3 hover:bg-gray-50 border-b border-gray-100 last:border-0"
                        onClick={() => {
                           setLookupType(team.teamType);
                           setLookupCategory(team.category);
                           setLookupTeamId(team.id);
                           setAdminSearchQuery('');
                        }}
                      >
                        <div className="font-semibold text-gray-900">{team.teamName}</div>
                        <div className="text-xs text-gray-500">{team.division} • {team.teamType} • {team.category}</div>
                      </button>
                   )) : <div className="p-3 text-sm text-gray-500">No programs found.</div>}
                 </div>
               )}
            </div>
            
            <div className="relative flex items-center py-2 mb-4">
                <div className="flex-grow border-t border-gray-200"></div>
                <span className="flex-shrink-0 mx-4 text-gray-400 text-xs font-semibold uppercase tracking-wider">OR FILTER BY CATEGORY</span>
                <div className="flex-grow border-t border-gray-200"></div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Team Type</label>
                <select className="w-full p-3 border border-gray-300 rounded-lg" value={lookupType} onChange={(e) => { setLookupType(e.target.value); setLookupCategory(''); setLookupTeamId(''); }}>
                  <option value="">Select Type...</option>
                  {types.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              {lookupType && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                  <select className="w-full p-3 border border-gray-300 rounded-lg animate-fade-in" value={lookupCategory} onChange={(e) => { setLookupCategory(e.target.value); setLookupTeamId(''); }}>
                    <option value="">Select Category...</option>
                    {categories.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              )}
              {lookupCategory && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Program Name</label>
                  <select className="w-full p-3 border border-gray-300 rounded-lg animate-fade-in" value={lookupTeamId} onChange={(e) => setLookupTeamId(e.target.value)}>
                    <option value="">Select Program...</option>
                    {availableTeams.map(t => <option key={t.id} value={t.id}>{t.teamName}</option>)}
                  </select>
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-col">
            {selectedTeam ? (
              <div className="bg-green-50 rounded-2xl p-8 border border-green-200 h-full flex flex-col justify-center animate-fade-in relative overflow-hidden shadow-sm">
                <div className="absolute top-0 right-0 bg-green-200 text-green-800 text-xs font-bold px-3 py-1 rounded-bl-lg">Active Configuration</div>
                <p className="text-green-800 text-sm font-semibold uppercase tracking-wider mb-2">Scoresheet Delivery Email</p>
                
                {isEditingEmail ? (
                  <div className="flex flex-col gap-3 w-full mt-2 animate-fade-in">
                    <input 
                      type="email" 
                      value={editEmailValue} 
                      onChange={e => setEditEmailValue(e.target.value)}
                      className="p-3 rounded-xl border border-green-300 focus:ring-2 focus:ring-green-500 focus:border-green-500 w-full text-gray-900 shadow-sm bg-white"
                      autoFocus
                    />
                    <div className="flex gap-2">
                      <button onClick={handleSaveEmail} className="bg-green-700 text-white px-4 py-2 rounded-lg hover:bg-green-800 transition-colors shadow-sm font-medium">Save Email</button>
                      <button onClick={() => setIsEditingEmail(false)} className="bg-white text-green-700 px-4 py-2 rounded-lg hover:bg-green-50 transition-colors shadow-sm font-medium">Cancel</button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 sm:gap-4">
                    <h4 className="text-xl sm:text-2xl lg:text-3xl font-bold text-green-900 break-all">{activeEmail}</h4>
                    <div className="flex gap-1 shrink-0">
                      <button onClick={handleCopy} className="p-2 sm:p-3 bg-white rounded-full text-green-700 shadow-sm hover:bg-green-100 transition-colors" title="Copy to clipboard">
                        {copied ? <IconCheck /> : <IconCopy />}
                      </button>
                      <button onClick={() => setIsEditingEmail(true)} className="p-2 sm:p-3 bg-white rounded-full text-green-700 shadow-sm hover:bg-green-100 transition-colors" title="Edit Email">
                        <IconEdit />
                      </button>
                    </div>
                  </div>
                )}

                <div className="mt-6 space-y-2 border-t border-green-200/50 pt-4">
                  <p className="text-sm text-green-700"><strong>Team:</strong> {selectedTeam.teamName} ({selectedTeam.division})</p>
                  <p className="text-sm text-green-700"><strong>Status:</strong> {selectedTeam.coachEmail ? 'Coach registered custom email' : 'Using default AD fallback'}</p>
                  <p className="text-xs text-green-600">Last Verified/Updated: {new Date(selectedTeam.lastUpdated).toLocaleDateString()}</p>
                </div>
              </div>
            ) : (
              <div className="bg-gray-50 rounded-2xl border border-gray-200 h-full flex items-center justify-center text-gray-400 p-8 text-center border-dashed">
                Select a team type, category, and name from the lookup tool to instantly view the correct delivery email address.
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'database' && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden animate-fade-in">
          <div className="p-4 border-b border-gray-200 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-gray-50">
            <div>
              <h3 className="font-semibold text-gray-800">Master Email Registry</h3>
              <p className="text-xs text-gray-500 mt-1">Upload <strong>2025-26 Season Recap for WIAA - Emails by Program.csv</strong> to set baseline data.</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <input type="file" accept=".csv" ref={fileInputRef} onChange={handleFileUpload} className="hidden" />
              <button 
                onClick={() => fileInputRef.current?.click()} 
                disabled={isImporting}
                className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 shadow-sm"
              >
                <IconUpload /> {isImporting ? 'Importing...' : 'Import CSV'}
              </button>
              <button onClick={handleExportCSV} className="flex items-center gap-2 bg-gray-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-black transition-colors shadow-sm">
                <IconDownload /> Export Data
              </button>
            </div>
          </div>
          
          {importMessage && (
            <div className={`p-4 text-sm font-medium border-b ${importMessage.type === 'success' ? 'bg-green-50 text-green-800 border-green-200' : 'bg-red-50 text-red-800 border-red-200'}`}>
              {importMessage.text}
            </div>
          )}

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-white text-xs uppercase tracking-wider text-gray-500 border-b border-gray-200">
                  <th className="p-4 font-medium">Program Name</th>
                  <th className="p-4 font-medium">Division, Type & Category</th>
                  <th className="p-4 font-medium">Active Delivery Email</th>
                  <th className="p-4 font-medium">Fallback (AD)</th>
                  <th className="p-4 font-medium">Last Updated</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-sm">
                {programs.length > 0 ? (
                  programs.map(p => (
                    <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                      <td className="p-4 font-medium text-gray-900 whitespace-nowrap">{p.teamName}</td>
                      <td className="p-4 text-gray-500 whitespace-nowrap">{p.division} • {p.teamType} • {p.category}</td>
                      <td className="p-4 font-semibold text-blue-600 whitespace-nowrap">{p.coachEmail || p.adEmail}</td>
                      <td className="p-4 text-gray-400 whitespace-nowrap">{p.adEmail}</td>
                      <td className="p-4 text-gray-400 whitespace-nowrap">{new Date(p.lastUpdated).toLocaleDateString()}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" className="p-8 text-center text-gray-400 italic">
                      No programs currently in registry. Click "Import CSV" above to load your season database.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default function App() {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null); 
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);
  const [programs, setPrograms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loggedInProgram, setLoggedInProgram] = useState(null);

  useEffect(() => {
    let unsubscribeSnapshot = null;

    const initAuthAndData = async () => {
      try {
        const token = typeof __initial_auth_token !== 'undefined' ? __initial_auth_token : null;
        if (token) {
          await signInWithCustomToken(auth, token);
        } else {
          await signInAnonymously(auth);
        }
        
        setUser(auth.currentUser);

        const programsRef = collection(db, 'artifacts', appId, 'public', 'data', 'programs');
        
        unsubscribeSnapshot = onSnapshot(programsRef, (snapshot) => {
          const loadedPrograms = [];
          snapshot.forEach(doc => {
            loadedPrograms.push({ id: doc.id, ...doc.data() });
          });
          setPrograms(loadedPrograms);
          setLoading(false);
        }, (error) => {
          console.error("Firestore error:", error);
          setLoading(false);
        });

      } catch (err) {
        console.error("Auth/Init Error:", err);
        setLoading(false);
      }
    };

    initAuthAndData();

    return () => {
      if (unsubscribeSnapshot) unsubscribeSnapshot();
    };
  }, []);

  const updateProgramEmail = async (programId, newEmail) => {
    if (!user) return;
    const docRef = doc(db, 'artifacts', appId, 'public', 'data', 'programs', programId);
    await updateDoc(docRef, { 
      coachEmail: newEmail,
      lastUpdated: Date.now() 
    });
    if (loggedInProgram && loggedInProgram.id === programId) {
      setLoggedInProgram({ ...loggedInProgram, coachEmail: newEmail, lastUpdated: Date.now() });
    }
  };

  const createNewProgram = async (newProgram) => {
    if (!user) return null;
    const id = `${newProgram.teamName}-${newProgram.teamType}-${newProgram.category}-${newProgram.division}`.toLowerCase().replace(/[^a-z0-9]/g, '-');
    const docRef = doc(db, 'artifacts', appId, 'public', 'data', 'programs', id);
    const fullProgram = { ...newProgram, id, lastUpdated: Date.now() };
    await setDoc(docRef, fullProgram);
    return fullProgram;
  };

  const updateProgramDetails = async (programId, details) => {
    if (!user) return;
    const docRef = doc(db, 'artifacts', appId, 'public', 'data', 'programs', programId);
    await updateDoc(docRef, { ...details, lastUpdated: Date.now() });
    if (loggedInProgram && loggedInProgram.id === programId) {
        setLoggedInProgram({ ...loggedInProgram, ...details, lastUpdated: Date.now() });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 font-sans selection:bg-blue-200">
      <header className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => { setRole(null); setLoggedInProgram(null); setIsAdminAuthenticated(false); }}>
            <div className="bg-blue-600 text-white p-2 rounded-lg">
              <IconShield />
            </div>
            <h1 className="text-xl font-bold tracking-tight text-gray-900">WSCJA <span className="text-blue-600">Email Registry</span></h1>
          </div>
          {role && (
            <button 
              onClick={() => { setRole(null); setLoggedInProgram(null); setIsAdminAuthenticated(false); }}
              className="text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors"
            >
              Switch Role
            </button>
          )}
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {!role ? (
          <div className="max-w-3xl mx-auto mt-10 animate-fade-in">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-extrabold text-gray-900 tracking-tight mb-4">Who are you logging in as?</h2>
              <p className="text-lg text-gray-500">Select your portal below to manage or view the scoresheet delivery registry.</p>
            </div>
            <div className="grid md:grid-cols-2 gap-6">
              <button 
                onClick={() => setRole('coach')}
                className="bg-white p-8 rounded-3xl shadow-sm border border-gray-200 hover:border-blue-500 hover:shadow-md transition-all text-left group"
              >
                <div className="bg-blue-50 text-blue-600 w-16 h-16 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <IconUsers />
                </div>
                <h3 className="text-2xl font-bold mb-2">Program Coach</h3>
                <p className="text-gray-500">Securely login to update your team's email address for scoresheet and penalty form delivery. Handle coaching substitutions easily.</p>
              </button>
              
              <button 
                onClick={() => setRole('admin')}
                className="bg-white p-8 rounded-3xl shadow-sm border border-gray-200 hover:border-gray-800 hover:shadow-md transition-all text-left group"
              >
                <div className="bg-gray-100 text-gray-800 w-16 h-16 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <IconShield />
                </div>
                <h3 className="text-2xl font-bold mb-2">WSCJA Scorekeeper</h3>
                <p className="text-gray-500">Access the master database, automatically lookup team emails, and export the most recent registry spreadsheet.</p>
              </button>
            </div>
          </div>
        ) : role === 'coach' ? (
          <CoachPortal 
            programs={programs} 
            onLogin={setLoggedInProgram} 
            loggedInProgram={loggedInProgram}
            onLogout={() => setLoggedInProgram(null)}
            updateEmail={updateProgramEmail}
            createProgram={createNewProgram}
            updateProgramDetails={updateProgramDetails}
          />
        ) : isAdminAuthenticated ? (
          <AdminPortal 
            programs={programs} 
            onLogout={() => { setRole(null); setIsAdminAuthenticated(false); }} 
            updateEmail={updateProgramEmail}
          />
        ) : (
          <AdminLogin onLogin={() => setIsAdminAuthenticated(true)} />
        )}
      </main>

      <style dangerouslySetInnerHTML={{__html: `
        .animate-fade-in { animation: fadeIn 0.3s ease-out forwards; }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(5px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}} />
    </div>
  );
}