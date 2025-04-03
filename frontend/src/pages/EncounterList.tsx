import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

interface InitiativeEntry {
  id: string;
  name: string;
  initiative: number | null;
  isNonPlayer: boolean;
  ac?: number;
  hp?: number;
  maxHp?: number;
  notes?: string;
}

interface Encounter {
  id: string;
  name: string;
  entries: InitiativeEntry[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export function EncounterList() {
  const [encounters, setEncounters] = useState<Encounter[]>([]);
  const [newEncounterName, setNewEncounterName] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchEncounters();
  }, []);

  const fetchEncounters = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5050/api/encounters', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch encounters');
      }

      const data = await response.json();
      setEncounters(data);
    } catch (error) {
      console.error('Error fetching encounters:', error);
    }
  };

  const handleCreateEncounter = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5050/api/encounters', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: newEncounterName }),
      });

      if (!response.ok) {
        throw new Error('Failed to create encounter');
      }

      const newEncounter = await response.json();
      setEncounters([...encounters, newEncounter]);
      setNewEncounterName('');
      navigate(`/encounters/${newEncounter.id}/edit`);
    } catch (error) {
      console.error('Error creating encounter:', error);
    }
  };

  const handleEditEncounter = (encounterId: string) => {
    navigate(`/encounters/${encounterId}/edit`);
  };

  const handleStartEncounter = async (encounterId: string) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/encounters/${encounterId}/activate`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to start encounter');
      }

      navigate(`/encounters/${encounterId}/prepare`);
    } catch (error) {
      console.error('Error starting encounter:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 py-6 flex flex-col justify-center sm:py-12">
      <div className="relative py-3 sm:max-w-xl sm:mx-auto">
        <div className="relative px-4 py-10 bg-white shadow-lg sm:rounded-3xl sm:p-20">
          <div className="max-w-md mx-auto">
            <h1 className="text-3xl font-bold text-center mb-8">Your Encounters</h1>

            {/* Create New Encounter Form */}
            <form onSubmit={handleCreateEncounter} className="mb-8">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newEncounterName}
                  onChange={(e) => setNewEncounterName(e.target.value)}
                  placeholder="New Encounter Name"
                  className="flex-1 border rounded px-3 py-2"
                  required
                />
                <button
                  type="submit"
                  className="bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600"
                >
                  Create
                </button>
              </div>
            </form>

            {/* Encounter List */}
            <div className="space-y-4">
              {encounters.map(encounter => (
                <div
                  key={encounter.id}
                  className="p-4 border rounded-lg bg-gray-50"
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="font-semibold">{encounter.name}</h3>
                      <div className="text-sm text-gray-500">
                        {encounter.entries.length} creatures
                      </div>
                    </div>
                    <div className="space-x-2">
                      <button
                        onClick={() => handleEditEncounter(encounter.id)}
                        className="text-blue-500 hover:text-blue-700"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleStartEncounter(encounter.id)}
                        className="text-green-500 hover:text-green-700"
                        disabled={encounter.entries.length === 0}
                      >
                        Start
                      </button>
                    </div>
                  </div>
                </div>
              ))}

              {encounters.length === 0 && (
                <div className="text-center text-gray-500">
                  No encounters yet. Create one to get started!
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 