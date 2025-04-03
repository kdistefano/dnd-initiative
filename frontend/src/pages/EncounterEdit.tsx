import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

interface InitiativeEntry {
  id: string;
  name: string;
  initiative: number | null;
  isNonPlayer: boolean;
  ac?: number;
  hp?: number;
  maxHp?: number;
  notes?: string;
  initiativeModifier: number;
  str: number;
  dex: number;
  con: number;
  int: number;
  wis: number;
  cha: number;
}

interface Encounter {
  id: string;
  name: string;
  entries: InitiativeEntry[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export function EncounterEdit() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [encounter, setEncounter] = useState<Encounter | null>(null);
  const [newCreature, setNewCreature] = useState({
    name: '',
    count: 1,
    ac: undefined as number | undefined,
    hp: undefined as number | undefined,
    maxHp: undefined as number | undefined,
    notes: '',
    initiativeModifier: 0,
    str: 0,
    dex: 0,
    con: 0,
    int: 0,
    wis: 0,
    cha: 0
  });

  useEffect(() => {
    if (id) {
      fetchEncounter();
    } else {
      // For new encounters, initialize with empty state
      setEncounter({
        id: '',
        name: 'New Encounter',
        entries: [],
        isActive: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
    }
  }, [id]);

  const fetchEncounter = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/encounters/${id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch encounter');
      }

      const data = await response.json();
      setEncounter(data);
    } catch (error) {
      console.error('Error fetching encounter:', error);
    }
  };

  const handleAddCreatures = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/encounters/${id}/creatures`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newCreature),
      });

      if (!response.ok) {
        throw new Error('Failed to add creatures');
      }

      const updatedEncounter = await response.json();
      setEncounter(updatedEncounter);
      setNewCreature({
        name: '',
        count: 1,
        ac: undefined,
        hp: undefined,
        maxHp: undefined,
        notes: '',
        initiativeModifier: 0,
        str: 0,
        dex: 0,
        con: 0,
        int: 0,
        wis: 0,
        cha: 0
      });
    } catch (error) {
      console.error('Error adding creatures:', error);
    }
  };

  const handleRemoveCreature = async (creatureId: string) => {
    if (!encounter || !id) return;

    const updatedEntries = encounter.entries.filter(entry => entry.id !== creatureId);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/encounters/${id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ entries: updatedEntries }),
      });

      if (!response.ok) {
        throw new Error('Failed to remove creature');
      }

      const updatedEncounter = await response.json();
      setEncounter(updatedEncounter);
    } catch (error) {
      console.error('Error removing creature:', error);
    }
  };

  const handleStartEncounter = async () => {
    if (!id) return;
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/encounters/${id}/activate`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to start encounter');
      }

      navigate(`/encounters/${id}/prepare`);
    } catch (error) {
      console.error('Error starting encounter:', error);
    }
  };

  if (!encounter) {
    return <div>Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-100 py-6 flex flex-col justify-center sm:py-12">
      <div className="relative py-3 sm:max-w-xl sm:mx-auto">
        <div className="relative px-4 py-10 bg-white shadow-lg sm:rounded-3xl sm:p-20">
          <div className="max-w-md mx-auto">
            <h1 className="text-3xl font-bold text-center mb-8">{encounter.name}</h1>

            {/* Add Creatures Form */}
            <form onSubmit={handleAddCreatures} className="space-y-4 mb-8">
              <h2 className="text-xl font-semibold">Add Creatures</h2>
              <div className="grid grid-cols-2 gap-4">
                <input
                  type="text"
                  value={newCreature.name}
                  onChange={(e) => setNewCreature({ ...newCreature, name: e.target.value })}
                  placeholder="Creature Name"
                  className="col-span-2 border rounded px-3 py-2"
                  required
                />
                <input
                  type="number"
                  value={newCreature.count}
                  onChange={(e) => setNewCreature({ ...newCreature, count: parseInt(e.target.value) })}
                  placeholder="Count"
                  min="1"
                  className="border rounded px-3 py-2"
                  required
                />
                <input
                  type="number"
                  value={newCreature.ac || ''}
                  onChange={(e) => setNewCreature({ ...newCreature, ac: parseInt(e.target.value) })}
                  placeholder="AC"
                  className="border rounded px-3 py-2"
                />
                <input
                  type="number"
                  value={newCreature.hp || ''}
                  onChange={(e) => setNewCreature({ ...newCreature, hp: parseInt(e.target.value) })}
                  placeholder="HP"
                  className="border rounded px-3 py-2"
                />
                <input
                  type="number"
                  value={newCreature.maxHp || ''}
                  onChange={(e) => setNewCreature({ ...newCreature, maxHp: parseInt(e.target.value) })}
                  placeholder="Max HP"
                  className="border rounded px-3 py-2"
                />
              </div>

              {/* Ability Score Modifiers */}
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="block text-sm font-medium text-gray-700">Initiative</label>
                  <input
                    type="number"
                    value={newCreature.initiativeModifier}
                    onChange={(e) => setNewCreature({ ...newCreature, initiativeModifier: parseInt(e.target.value) || 0 })}
                    className="w-full border rounded px-3 py-2"
                    placeholder="+0"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-sm font-medium text-gray-700">STR</label>
                  <input
                    type="number"
                    value={newCreature.str}
                    onChange={(e) => setNewCreature({ ...newCreature, str: parseInt(e.target.value) || 0 })}
                    className="w-full border rounded px-3 py-2"
                    placeholder="+0"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-sm font-medium text-gray-700">DEX</label>
                  <input
                    type="number"
                    value={newCreature.dex}
                    onChange={(e) => setNewCreature({ ...newCreature, dex: parseInt(e.target.value) || 0 })}
                    className="w-full border rounded px-3 py-2"
                    placeholder="+0"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-sm font-medium text-gray-700">CON</label>
                  <input
                    type="number"
                    value={newCreature.con}
                    onChange={(e) => setNewCreature({ ...newCreature, con: parseInt(e.target.value) || 0 })}
                    className="w-full border rounded px-3 py-2"
                    placeholder="+0"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-sm font-medium text-gray-700">INT</label>
                  <input
                    type="number"
                    value={newCreature.int}
                    onChange={(e) => setNewCreature({ ...newCreature, int: parseInt(e.target.value) || 0 })}
                    className="w-full border rounded px-3 py-2"
                    placeholder="+0"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-sm font-medium text-gray-700">WIS</label>
                  <input
                    type="number"
                    value={newCreature.wis}
                    onChange={(e) => setNewCreature({ ...newCreature, wis: parseInt(e.target.value) || 0 })}
                    className="w-full border rounded px-3 py-2"
                    placeholder="+0"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-sm font-medium text-gray-700">CHA</label>
                  <input
                    type="number"
                    value={newCreature.cha}
                    onChange={(e) => setNewCreature({ ...newCreature, cha: parseInt(e.target.value) || 0 })}
                    className="w-full border rounded px-3 py-2"
                    placeholder="+0"
                  />
                </div>
              </div>

              <textarea
                value={newCreature.notes}
                onChange={(e) => setNewCreature({ ...newCreature, notes: e.target.value })}
                placeholder="Notes (optional)"
                className="w-full border rounded px-3 py-2 mt-4"
                rows={2}
              />

              <button
                type="submit"
                className="w-full bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600"
              >
                Add Creature
              </button>
            </form>

            {/* Creature List */}
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold">Creatures</h2>
                {encounter.entries.length > 0 && (
                  <button
                    onClick={handleStartEncounter}
                    className="bg-green-500 text-white py-2 px-4 rounded hover:bg-green-600"
                  >
                    Start Encounter
                  </button>
                )}
              </div>

              {encounter.entries.map(creature => (
                <div
                  key={creature.id}
                  className="p-4 border rounded-lg bg-gray-50"
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="font-semibold">{creature.name}</h3>
                      {creature.ac && <div className="text-sm">AC: {creature.ac}</div>}
                      {creature.hp && (
                        <div className="text-sm">
                          HP: {creature.hp}
                          {creature.maxHp && <span> / {creature.maxHp}</span>}
                        </div>
                      )}
                      <div className="text-sm text-gray-600">
                        Initiative: {creature.initiativeModifier >= 0 ? '+' : ''}{creature.initiativeModifier}
                      </div>
                      <div className="text-sm text-gray-600">
                        STR: {creature.str >= 0 ? '+' : ''}{creature.str} | 
                        DEX: {creature.dex >= 0 ? '+' : ''}{creature.dex} | 
                        CON: {creature.con >= 0 ? '+' : ''}{creature.con} | 
                        INT: {creature.int >= 0 ? '+' : ''}{creature.int} | 
                        WIS: {creature.wis >= 0 ? '+' : ''}{creature.wis} | 
                        CHA: {creature.cha >= 0 ? '+' : ''}{creature.cha}
                      </div>
                      {creature.notes && (
                        <div className="text-sm text-gray-600 mt-1">{creature.notes}</div>
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
              ))}

              {encounter.entries.length === 0 && (
                <div className="text-center text-gray-500">
                  No creatures added yet. Add some to get started!
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 