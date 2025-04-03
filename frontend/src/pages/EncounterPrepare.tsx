import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Creature } from '../types/creature';
import { Encounter } from '../types/encounter';

interface EncounterPrepareProps {
  token: string;
}

export function EncounterPrepare({ token }: EncounterPrepareProps) {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [encounter, setEncounter] = useState<Encounter | null>(null);
  const [creatures, setCreatures] = useState<Creature[]>([]);
  const [newPlayer, setNewPlayer] = useState({ 
    name: '', 
    initiativeModifier: 0,
    initiative: null as number | null 
  });
  const [newCreature, setNewCreature] = useState({ name: '', initiativeModifier: 0 });
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;

    const fetchEncounter = async () => {
      try {
        const response = await fetch(`/api/encounters/${id}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        if (!response.ok) throw new Error('Failed to fetch encounter');
        const data = await response.json();
        setEncounter(data);
        setCreatures(data.entries || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch encounter');
      }
    };

    fetchEncounter();
  }, [id, token]);

  const handleAddPlayer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPlayer.name.trim() || newPlayer.initiative === null) return;

    const player: Creature = {
      id: crypto.randomUUID(),
      name: newPlayer.name,
      initiativeModifier: newPlayer.initiativeModifier,
      initiative: newPlayer.initiative,
      isNonPlayer: false
    };

    try {
      const response = await fetch(`/api/encounters/${id}/creatures`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(player)
      });

      if (!response.ok) throw new Error('Failed to add player');
      
      const updatedEncounter = await response.json();
      setEncounter(updatedEncounter);
      setCreatures(updatedEncounter.entries || []);
      setNewPlayer({ name: '', initiativeModifier: 0, initiative: null });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add player');
    }
  };

  const handleAddCreature = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCreature.name.trim()) return;

    const creature: Creature = {
      id: crypto.randomUUID(),
      name: newCreature.name,
      initiativeModifier: newCreature.initiativeModifier,
      isNonPlayer: true,
      initiative: null
    };

    try {
      const response = await fetch(`/api/encounters/${id}/creatures`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(creature)
      });

      if (!response.ok) throw new Error('Failed to add creature');
      
      const updatedEncounter = await response.json();
      setEncounter(updatedEncounter);
      setCreatures(updatedEncounter.entries || []);
      setNewCreature({ name: '', initiativeModifier: 0 });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add creature');
    }
  };

  const handleStartCombat = () => {
    navigate(`/encounters/${id}/run`);
  };

  const handleRemoveCreature = async (creatureId: string) => {
    try {
      const response = await fetch(`/api/encounters/${id}/creatures/${creatureId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) throw new Error('Failed to remove creature');
      
      const updatedEncounter = await response.json();
      setEncounter(updatedEncounter);
      setCreatures(updatedEncounter.entries || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove creature');
    }
  };

  if (error) {
    return <div className="error-message">{error}</div>;
  }

  if (!encounter) {
    return <div>Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-100 py-6 flex flex-col justify-center sm:py-12">
      <div className="relative py-3 sm:max-w-xl sm:mx-auto">
        <div className="relative px-4 py-10 bg-white shadow-lg sm:rounded-3xl sm:p-20">
          <div className="max-w-md mx-auto">
            <div className="divide-y divide-gray-200">
              <div className="py-8 text-base leading-6 space-y-4 text-gray-700 sm:text-lg sm:leading-7">
                <div className="flex justify-between items-center mb-8">
                  <button
                    onClick={() => navigate('/')}
                    className="text-blue-500 hover:text-blue-700 flex items-center"
                  >
                    <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                    </svg>
                    Back to Encounters
                  </button>
                  <h1 className="text-3xl font-bold text-center">{encounter.name}</h1>
                </div>
                
                {/* Current Creatures List */}
                <div className="space-y-4 mb-8">
                  <h2 className="text-xl font-semibold">Current Creatures</h2>
                  <div className="space-y-2">
                    {creatures.length === 0 ? (
                      <div className="text-center text-gray-500 py-4">
                        No creatures added yet. Add some below to get started!
                      </div>
                    ) : (
                      creatures.map(creature => (
                        <div
                          key={creature.id}
                          className="p-4 rounded bg-gray-50 border"
                        >
                          <div className="flex justify-between items-start">
                            <div>
                              <h3 className="font-semibold">{creature.name}</h3>
                              <div className="text-sm text-gray-500">
                                Type: {creature.isNonPlayer ? 'NPC' : 'Player'}
                              </div>
                              <div className="text-sm text-gray-500">
                                Initiative Modifier: {creature.initiativeModifier >= 0 ? '+' : ''}{creature.initiativeModifier}
                              </div>
                              {creature.ac && (
                                <div className="text-sm text-gray-500">
                                  AC: {creature.ac}
                                </div>
                              )}
                              {creature.hp && (
                                <div className="text-sm text-gray-500">
                                  HP: {creature.hp}
                                  {creature.maxHp && <span> / {creature.maxHp}</span>}
                                </div>
                              )}
                              {creature.notes && (
                                <div className="text-sm text-gray-500 mt-1">
                                  Notes: {creature.notes}
                                </div>
                              )}
                            </div>
                            <button
                              onClick={() => handleRemoveCreature(creature.id)}
                              className="text-red-500 hover:text-red-700"
                            >
                              Remove
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Add Creatures Section */}
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Add Player</h3>
                    <form onSubmit={handleAddPlayer} className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <input
                          type="text"
                          value={newPlayer.name}
                          onChange={(e) => setNewPlayer({ ...newPlayer, name: e.target.value })}
                          placeholder="Player Name"
                          className="border rounded px-3 py-2"
                        />
                        <input
                          type="number"
                          value={newPlayer.initiative || ''}
                          onChange={(e) => setNewPlayer({ ...newPlayer, initiative: parseInt(e.target.value) || null })}
                          placeholder="Initiative Roll"
                          className="border rounded px-3 py-2"
                          required
                        />
                      </div>
                      <div className="grid grid-cols-1 gap-4">
                        <input
                          type="number"
                          value={newPlayer.initiativeModifier}
                          onChange={(e) => setNewPlayer({ ...newPlayer, initiativeModifier: parseInt(e.target.value) || 0 })}
                          placeholder="Initiative Modifier (for tie-breaking)"
                          className="border rounded px-3 py-2"
                        />
                        <div className="text-sm text-gray-500">
                          Initiative Modifier is only used for breaking ties in the initiative order
                        </div>
                      </div>
                      <button
                        type="submit"
                        className="w-full bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600"
                      >
                        Add Player
                      </button>
                    </form>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold mb-4">Add NPC</h3>
                    <form onSubmit={handleAddCreature} className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <input
                          type="text"
                          value={newCreature.name}
                          onChange={(e) => setNewCreature({ ...newCreature, name: e.target.value })}
                          placeholder="NPC Name"
                          className="border rounded px-3 py-2"
                        />
                        <input
                          type="number"
                          value={newCreature.initiativeModifier}
                          onChange={(e) => setNewCreature({ ...newCreature, initiativeModifier: parseInt(e.target.value) || 0 })}
                          placeholder="Initiative Modifier"
                          className="border rounded px-3 py-2"
                        />
                      </div>
                      <button
                        type="submit"
                        className="w-full bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600"
                      >
                        Add NPC
                      </button>
                    </form>
                  </div>
                </div>

                {/* Start Combat Button */}
                <div className="pt-6">
                  <button 
                    onClick={handleStartCombat}
                    disabled={creatures.length === 0}
                    className={`w-full py-3 px-4 rounded text-white font-semibold ${
                      creatures.length === 0
                        ? 'bg-gray-400 cursor-not-allowed'
                        : 'bg-green-500 hover:bg-green-600'
                    }`}
                  >
                    Start Combat
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}