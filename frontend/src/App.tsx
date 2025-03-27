import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { io, Socket } from 'socket.io-client';
import { v4 as uuidv4 } from 'uuid';
import { InitiativeEntry, InitiativeState } from './types';
import { Login } from './pages/Login';
import { EncounterList } from './pages/EncounterList';
import { EncounterEdit } from './pages/EncounterEdit';
import { EncounterRun } from './pages/EncounterRun';
import { EncounterPrepare } from './pages/EncounterPrepare';
import { NavBar } from './components/NavBar';

function InitiativeTracker({ token }: { token: string }) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [state, setState] = useState<InitiativeState>({
    entries: [],
    currentTurn: 0,
    isActive: false,
  });
  const [newEntry, setNewEntry] = useState<Partial<InitiativeEntry>>({
    name: '',
    initiative: 0,
    isNonPlayer: false,
  });

  useEffect(() => {
    const newSocket = io('http://localhost:5050', {
      auth: { token }
    });

    newSocket.on('initiativeList', (entries: InitiativeEntry[]) => {
      setState(prev => ({ ...prev, entries }));
    });

    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, [token]);

  const handleAddEntry = () => {
    if (!socket || !newEntry.name || !newEntry.initiative) return;

    const entry: InitiativeEntry = {
      id: uuidv4(),
      name: newEntry.name,
      initiative: newEntry.initiative,
      isNonPlayer: newEntry.isNonPlayer || false,
      ac: newEntry.isNonPlayer ? newEntry.ac : undefined,
      hp: newEntry.isNonPlayer ? newEntry.hp : undefined,
      maxHp: newEntry.isNonPlayer ? newEntry.maxHp : undefined,
      notes: newEntry.notes,
    };

    socket.emit('addInitiative', entry);
    setNewEntry({
      name: '',
      initiative: 0,
      isNonPlayer: false,
    });
  };

  const handleRemoveEntry = (id: string) => {
    if (!socket) return;
    socket.emit('removeInitiative', id);
  };

  const handleUpdateEntry = (entry: InitiativeEntry) => {
    if (!socket) return;
    socket.emit('updateInitiative', entry);
  };

  const handleClearInitiative = () => {
    if (!socket) return;
    socket.emit('clearInitiative');
  };

  const handleNextTurn = () => {
    setState(prev => ({
      ...prev,
      currentTurn: (prev.currentTurn + 1) % prev.entries.length,
    }));
  };

  return (
    <div className="min-h-screen bg-gray-100 py-6 flex flex-col justify-center sm:py-12">
      <div className="relative py-3 sm:max-w-xl sm:mx-auto">
        <div className="relative px-4 py-10 bg-white shadow-lg sm:rounded-3xl sm:p-20">
          <div className="max-w-md mx-auto">
            <div className="divide-y divide-gray-200">
              <div className="py-8 text-base leading-6 space-y-4 text-gray-700 sm:text-lg sm:leading-7">
                <h1 className="text-3xl font-bold text-center mb-8">D&D Initiative Tracker</h1>
                
                {/* Add New Entry Form */}
                <div className="space-y-4 mb-8">
                  <h2 className="text-xl font-semibold">Add New Entry</h2>
                  <div className="grid grid-cols-2 gap-4">
                    <input
                      type="text"
                      placeholder="Name"
                      value={newEntry.name}
                      onChange={(e) => setNewEntry({ ...newEntry, name: e.target.value })}
                      className="border rounded px-3 py-2"
                    />
                    <input
                      type="number"
                      placeholder="Initiative"
                      value={newEntry.initiative}
                      onChange={(e) => setNewEntry({ ...newEntry, initiative: parseInt(e.target.value) })}
                      className="border rounded px-3 py-2"
                    />
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={newEntry.isNonPlayer}
                        onChange={(e) => setNewEntry({ ...newEntry, isNonPlayer: e.target.checked })}
                        className="rounded"
                      />
                      <label>Non-player</label>
                    </div>
                  </div>

                  {/* Non-player specific fields */}
                  {newEntry.isNonPlayer && (
                    <div className="grid grid-cols-2 gap-4 mt-4">
                      <input
                        type="number"
                        placeholder="AC"
                        value={newEntry.ac || ''}
                        onChange={(e) => setNewEntry({ ...newEntry, ac: parseInt(e.target.value) })}
                        className="border rounded px-3 py-2"
                      />
                      <input
                        type="number"
                        placeholder="HP"
                        value={newEntry.hp || ''}
                        onChange={(e) => setNewEntry({ ...newEntry, hp: parseInt(e.target.value) })}
                        className="border rounded px-3 py-2"
                      />
                      <input
                        type="number"
                        placeholder="Max HP"
                        value={newEntry.maxHp || ''}
                        onChange={(e) => setNewEntry({ ...newEntry, maxHp: parseInt(e.target.value) })}
                        className="border rounded px-3 py-2"
                      />
                    </div>
                  )}

                  <textarea
                    placeholder="Notes (optional)"
                    value={newEntry.notes || ''}
                    onChange={(e) => setNewEntry({ ...newEntry, notes: e.target.value })}
                    className="w-full border rounded px-3 py-2 mt-4"
                    rows={2}
                  />

                  <button
                    onClick={handleAddEntry}
                    className="w-full bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600"
                  >
                    Add Entry
                  </button>
                </div>

                {/* Initiative List */}
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h2 className="text-xl font-semibold">Initiative Order</h2>
                    <div className="space-x-2">
                      <button
                        onClick={handleClearInitiative}
                        className="bg-red-500 text-white py-2 px-4 rounded hover:bg-red-600"
                      >
                        Clear All
                      </button>
                      <button
                        onClick={handleNextTurn}
                        className="bg-green-500 text-white py-2 px-4 rounded hover:bg-green-600"
                      >
                        Next Turn
                      </button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    {state.entries.map((entry, index) => (
                      <div
                        key={entry.id}
                        className={`p-4 rounded ${
                          index === state.currentTurn
                            ? 'bg-blue-100 border-2 border-blue-500'
                            : 'bg-gray-50 border'
                        }`}
                      >
                        <div className="flex justify-between items-center">
                          <div>
                            <span className="font-semibold">{entry.name}</span>
                            <span className="ml-2 text-gray-500">(Initiative: {entry.initiative})</span>
                          </div>
                          <button
                            onClick={() => handleRemoveEntry(entry.id)}
                            className="text-red-500 hover:text-red-700"
                          >
                            Remove
                          </button>
                        </div>
                        {entry.isNonPlayer && (
                          <div className="mt-2 space-y-1">
                            {entry.ac !== undefined && (
                              <div className="text-gray-600">AC: {entry.ac}</div>
                            )}
                            {entry.hp !== undefined && (
                              <div className="text-gray-600">
                                HP: {entry.hp}
                                {entry.maxHp && <span> / {entry.maxHp}</span>}
                              </div>
                            )}
                          </div>
                        )}
                        {entry.notes && (
                          <div className="mt-2 text-sm text-gray-600">{entry.notes}</div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function App() {
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));

  const handleLogin = (newToken: string) => {
    localStorage.setItem('token', newToken);
    setToken(newToken);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setToken(null);
  };

  return (
    <Router>
      <div className="min-h-screen bg-gray-100">
        {token && <NavBar onLogout={handleLogout} />}
        <Routes>
          <Route
            path="/login"
            element={
              token ? (
                <Navigate to="/" replace />
              ) : (
                <Login onLogin={handleLogin} />
              )
            }
          />
          <Route
            path="/"
            element={
              token ? (
                <EncounterList />
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />
          <Route
            path="/encounters/new"
            element={
              token ? (
                <EncounterEdit />
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />
          <Route
            path="/encounters/:id/edit"
            element={
              token ? (
                <EncounterEdit />
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />
          <Route
            path="/encounters/:id/prepare"
            element={
              token ? (
                <EncounterPrepare token={token} />
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />
          <Route
            path="/encounters/:id/run"
            element={
              token ? (
                <EncounterRun />
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />
        </Routes>
      </div>
    </Router>
  );
}

export default App; 