import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { io, Socket } from 'socket.io-client';
import '../styles/EncounterRun.css';

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
  str?: number;
  dex?: number;
  con?: number;
  int?: number;
  wis?: number;
  cha?: number;
  isNewToRound?: boolean;
  hasActed?: boolean;
}

interface EncounterState {
  entries: InitiativeEntry[];
  currentTurn: number;
  isActive: boolean;
  roundNumber: number;
}

interface RollResult {
  d20Roll: number;
  modifier: number;
  total: number;
  isAnimating: boolean;
  currentRoll?: number;
}

export function EncounterRun() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [state, setState] = useState<EncounterState>({
    entries: [],
    currentTurn: 0,
    isActive: true,
    roundNumber: 1
  });
  const [showInitiativeForm, setShowInitiativeForm] = useState(true);
  const [pendingInitiatives, setPendingInitiatives] = useState<Record<string, number>>({});
  const [rollResults, setRollResults] = useState<Record<string, RollResult>>({});
  const [newCreature, setNewCreature] = useState({
    name: '',
    isNonPlayer: true,
    ac: undefined as number | undefined,
    hp: undefined as number | undefined,
    maxHp: undefined as number | undefined,
    initiativeModifier: 0,
    str: 0,
    dex: 0,
    con: 0,
    int: 0,
    wis: 0,
    cha: 0,
  });
  const [newPlayer, setNewPlayer] = useState({
    name: '',
    initiative: 0,
    ac: undefined as number | undefined,
    hp: undefined as number | undefined,
    maxHp: undefined as number | undefined,
    notes: '',
  });
  const [editingInitiative, setEditingInitiative] = useState<string | null>(null);
  const [editInitiativeValue, setEditInitiativeValue] = useState<number>(0);
  const [expandedEntries, setExpandedEntries] = useState<Set<string>>(new Set());
  const [activeEntries, setActiveEntries] = useState<InitiativeEntry[]>([]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const newSocket = io('http://localhost:5050', {
      auth: { token }
    });

    newSocket.on('connect', () => {
      console.log('Connected to socket server');
      newSocket.emit('joinEncounter', id);
    });

    newSocket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
    });

    newSocket.on('initiativeList', (entries: InitiativeEntry[]) => {
      console.log('Received initiative list:', entries);
      setState(prev => ({ 
        ...prev, 
        entries: entries.sort((a, b) => {
          if (a.initiative === null) return 1;
          if (b.initiative === null) return -1;
          return b.initiative - a.initiative;
        })
      }));
    });

    // Initialize state
    const fetchEncounter = async () => {
      try {
        const response = await fetch(`http://localhost:5050/api/encounters/${id}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
        
        if (response.ok) {
          const encounter = await response.json();
          console.log('Fetched encounter:', encounter);
          
          setState(prev => ({ 
            ...prev, 
            entries: encounter.entries,
            isActive: encounter.isActive 
          }));
          
          // If the encounter is already active, hide the initiative form
          setShowInitiativeForm(!encounter.isActive);
        }
      } catch (error) {
        console.error('Error fetching encounter:', error);
      }
    };
    
    fetchEncounter();
    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, [id]);

  useEffect(() => {
    if (!showInitiativeForm) {
      setActiveEntries(state.entries);
    }
  }, [state.entries, showInitiativeForm]);

  const handleUpdateEntry = (entry: InitiativeEntry) => {
    if (!socket) return;
    socket.emit('updateInitiative', entry);
  };

  const handleNextTurn = () => {
    setState(prev => {
      // Mark current creature as having acted
      const updatedEntries = prev.entries.map((entry, index) => 
        index === prev.currentTurn ? { ...entry, hasActed: true } : entry
      );
      
      // Check if everyone has acted
      const allHaveActed = updatedEntries.every(entry => entry.hasActed);
      
      // If everyone has acted, start a new round
      if (allHaveActed) {
        // Reset hasActed for all entries and sort by initiative
        const sortedEntries = updatedEntries.map(entry => ({ ...entry, hasActed: false }))
          .sort((a, b) => {
            if (a.initiative === null) return 1;
            if (b.initiative === null) return -1;
            return (b.initiative || 0) - (a.initiative || 0);
          });
        
        return {
          ...prev,
          currentTurn: 0,
          roundNumber: prev.roundNumber + 1,
          entries: sortedEntries
        };
      }
      
      // Otherwise, move to the next creature
      const nextTurnIndex = (prev.currentTurn + 1) % prev.entries.length;
      return {
        ...prev,
        currentTurn: nextTurnIndex,
        entries: updatedEntries
      };
    });
  };

  const handleEndEncounter = async () => {
    try {
      const token = localStorage.getItem('token');
      await fetch(`http://localhost:5050/api/encounters/${id}/deactivate`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      navigate('/');
    } catch (error) {
      console.error('Error ending encounter:', error);
    }
  };

  const handleInitiativeChange = (entryId: string, value: string) => {
    const numValue = parseInt(value);
    if (isNaN(numValue)) return;
    setPendingInitiatives(prev => ({
      ...prev,
      [entryId]: numValue
    }));
  };

  const rollD20 = () => {
    return Math.floor(Math.random() * 20) + 1;
  };

  const animateRoll = async (entryId: string, d20Roll: number, modifier: number) => {
    const total = d20Roll + modifier;
    const steps = 10;
    const delay = 50; // ms

    for (let i = 0; i < steps; i++) {
      const currentRoll = Math.floor(Math.random() * 20) + 1;
      setRollResults(prev => ({
        ...prev,
        [entryId]: {
          d20Roll,
          modifier,
          total,
          isAnimating: true,
          currentRoll
        }
      }));
      await new Promise(resolve => setTimeout(resolve, delay));
    }

    setRollResults(prev => ({
      ...prev,
      [entryId]: {
        d20Roll,
        modifier,
        total,
        isAnimating: false
      }
    }));
  };

  const handleRollForNPC = async (entry: InitiativeEntry) => {
    const d20Roll = rollD20();
    const total = d20Roll + entry.initiativeModifier;
    await animateRoll(entry.id, d20Roll, entry.initiativeModifier);
    
    handleUpdateEntry({
      ...entry,
      initiative: total
    });
  };

  const handleRollForAllNPCs = async () => {
    const newInitiatives = { ...pendingInitiatives };
    const npcs = state.entries.filter(entry => entry.isNonPlayer);
    
    if (npcs.length === 0) return;

    // Calculate all rolls first
    const rolls = npcs.map(entry => {
      const roll = rollD20();
      const total = roll + entry.initiativeModifier;
      return { entry, roll, total };
    });

    // Update initiatives
    rolls.forEach(({ entry, total }) => {
      newInitiatives[entry.id] = total;
    });
    setPendingInitiatives(newInitiatives);

    // Animate all rolls
    const animationPromises = rolls.map(({ entry, roll }) => 
      animateRoll(entry.id, roll, entry.initiativeModifier)
    );

    try {
      await Promise.all(animationPromises);

      // If we're in combat, update the initiatives in the backend
      if (!showInitiativeForm) {
        const token = localStorage.getItem('token');
        const response = await fetch(`http://localhost:5050/api/encounters/${id}/initiatives`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ initiatives: newInitiatives }),
        });

        if (!response.ok) {
          throw new Error('Failed to update initiatives');
        }

        const updatedEncounter = await response.json();
        setState(prev => ({
          ...prev,
          entries: updatedEncounter.entries
        }));
      }
    } catch (error) {
      console.error('Error in roll for all NPCs:', error);
    }
  };

  const handleAddCreature = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!socket) return;

    const entry: InitiativeEntry = {
      id: crypto.randomUUID(),
      name: newCreature.name,
      initiative: null,
      isNonPlayer: true,
      ac: newCreature.ac,
      hp: newCreature.hp,
      maxHp: newCreature.maxHp,
      initiativeModifier: newCreature.initiativeModifier,
      str: newCreature.str,
      dex: newCreature.dex,
      con: newCreature.con,
      int: newCreature.int,
      wis: newCreature.wis,
      cha: newCreature.cha,
    };

    socket.emit('addInitiative', entry);
    setNewCreature({
      name: '',
      isNonPlayer: true,
      ac: undefined,
      hp: undefined,
      maxHp: undefined,
      initiativeModifier: 0,
      str: 0,
      dex: 0,
      con: 0,
      int: 0,
      wis: 0,
      cha: 0,
    });
  };

  const handleAddPlayer = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!socket) return;

    const entry: InitiativeEntry = {
      id: crypto.randomUUID(),
      name: newPlayer.name,
      initiative: newPlayer.initiative,
      isNonPlayer: false,
      ac: newPlayer.ac,
      hp: newPlayer.hp,
      maxHp: newPlayer.maxHp,
      notes: newPlayer.notes,
      initiativeModifier: 0,
    };

    socket.emit('addInitiative', entry);
    setNewPlayer({
      name: '',
      initiative: 0,
      ac: undefined,
      hp: undefined,
      maxHp: undefined,
      notes: '',
    });
  };

  const handleStartCombat = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5050/api/encounters/${id}/activate`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to activate encounter');
      }

      const updatedEntries = state.entries.map(entry => ({
        ...entry,
        initiative: pendingInitiatives[entry.id] ?? null
      }));

      // Update initiatives in the backend
      const initiativeResponse = await fetch(`http://localhost:5050/api/encounters/${id}/initiatives`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ initiatives: pendingInitiatives }),
      });

      if (!initiativeResponse.ok) {
        throw new Error('Failed to update initiatives');
      }

      // Update local state with sorted entries
      const sortedEntries = updatedEntries.sort((a, b) => {
        if (a.initiative === null) return 1;
        if (b.initiative === null) return -1;
        return (b.initiative || 0) - (a.initiative || 0);
      });

      setState(prev => ({
        ...prev,
        entries: sortedEntries,
        currentTurn: 0
      }));
      setActiveEntries(sortedEntries);
      setShowInitiativeForm(false);
      setPendingInitiatives({});
    } catch (error) {
      console.error('Error starting combat:', error);
    }
  };

  const allInitiativesSet = state.entries.every(entry => 
    entry.initiative !== null || pendingInitiatives[entry.id] !== undefined
  );

  const handleEditInitiative = (entry: InitiativeEntry) => {
    setEditingInitiative(entry.id);
    setEditInitiativeValue(entry.initiative || 0);
  };

  const handleSaveInitiative = async (entry: InitiativeEntry) => {
    handleUpdateEntry({
      ...entry,
      initiative: editInitiativeValue
    });
    setEditingInitiative(null);
  };

  const toggleEntryExpanded = (entryId: string) => {
    setExpandedEntries(prev => {
      const newSet = new Set(prev);
      if (newSet.has(entryId)) {
        newSet.delete(entryId);
      } else {
        newSet.add(entryId);
      }
      return newSet;
    });
  };

  const handleRemoveCreature = async (entryId: string) => {
    if (!socket) return;
    socket.emit('removeInitiative', entryId);
  };

  return (
    <div className="encounter-run-container">
      <div className="main-content">
        <div className="initiative-list-column">
          <h2>Initiative Order</h2>
          {!showInitiativeForm && (
            <div className="round-indicator">
              Round {state.roundNumber}
            </div>
          )}
          {state.entries.map((entry, index) => (
            <div
              key={entry.id}
              className={`initiative-entry ${index === state.currentTurn ? 'current-turn' : ''} ${entry.isNewToRound ? 'new-to-round' : ''} ${entry.hasActed ? 'turn-completed' : ''}`}
            >
              <div 
                className="entry-header"
                onClick={() => toggleEntryExpanded(entry.id)}
                style={{ cursor: 'pointer' }}
              >
                <div className="initiative-value">
                  <div className="init-label">Init</div>
                  <div className="init-number">
                    {entry.initiative !== null ? entry.initiative : '-'}
                  </div>
                </div>
                <div className="entry-name">{entry.name}</div>
                <div className="entry-controls">
                  {showInitiativeForm ? (
                    <>
                      <input
                        type="number"
                        value={pendingInitiatives[entry.id] || ''}
                        onChange={(e) => handleInitiativeChange(entry.id, e.target.value)}
                        placeholder="Initiative"
                        onClick={(e) => e.stopPropagation()}
                      />
                      {entry.isNonPlayer && (
                        <button onClick={(e) => {
                          e.stopPropagation();
                          handleRollForNPC(entry);
                        }}>Roll</button>
                      )}
                    </>
                  ) : (
                    <>
                      {entry.isNonPlayer && (
                        <button onClick={(e) => {
                          e.stopPropagation();
                          handleRollForNPC(entry);
                        }}>Roll</button>
                      )}
                      {editingInitiative === entry.id ? (
                        <>
                          <input
                            type="number"
                            value={editInitiativeValue}
                            onChange={(e) => setEditInitiativeValue(parseInt(e.target.value) || 0)}
                            onClick={(e) => e.stopPropagation()}
                          />
                          <button onClick={(e) => {
                            e.stopPropagation();
                            handleSaveInitiative(entry);
                          }}>Save</button>
                          <button onClick={(e) => {
                            e.stopPropagation();
                            setEditingInitiative(null);
                          }}>Cancel</button>
                        </>
                      ) : (
                        <>
                          <button onClick={(e) => {
                            e.stopPropagation();
                            handleEditInitiative(entry);
                          }}>Edit</button>
                          <button 
                            className="remove-creature-btn"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRemoveCreature(entry.id);
                            }}
                          >
                            Remove
                          </button>
                        </>
                      )}
                    </>
                  )}
                </div>
              </div>
              
              {expandedEntries.has(entry.id) && (
                <div className="entry-details">
                  <div className="stats-grid">
                    <div className="stat-item">
                      <span className="stat-label">AC:</span>
                      <span className="stat-value">{entry.ac || '-'}</span>
                    </div>
                    <div className="stat-item">
                      <span className="stat-label">HP:</span>
                      <span className="stat-value">
                        {entry.hp !== undefined ? `${entry.hp}${entry.maxHp ? `/${entry.maxHp}` : ''}` : '-'}
                      </span>
                    </div>
                    <div className="stat-item">
                      <span className="stat-label">Initiative Mod:</span>
                      <span className="stat-value">{entry.initiativeModifier}</span>
                    </div>
                    {entry.isNonPlayer && (
                      <>
                        <div className="stat-item">
                          <span className="stat-label">STR:</span>
                          <span className="stat-value">{entry.str || '-'}</span>
                        </div>
                        <div className="stat-item">
                          <span className="stat-label">DEX:</span>
                          <span className="stat-value">{entry.dex || '-'}</span>
                        </div>
                        <div className="stat-item">
                          <span className="stat-label">CON:</span>
                          <span className="stat-value">{entry.con || '-'}</span>
                        </div>
                        <div className="stat-item">
                          <span className="stat-label">INT:</span>
                          <span className="stat-value">{entry.int || '-'}</span>
                        </div>
                        <div className="stat-item">
                          <span className="stat-label">WIS:</span>
                          <span className="stat-value">{entry.wis || '-'}</span>
                        </div>
                        <div className="stat-item">
                          <span className="stat-label">CHA:</span>
                          <span className="stat-value">{entry.cha || '-'}</span>
                        </div>
                      </>
                    )}
                  </div>
                  {entry.notes && (
                    <div className="entry-notes">
                      <span className="stat-label">Notes:</span>
                      <span className="stat-value">{entry.notes}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="controls-column">
          <div className="combat-controls">
            {!showInitiativeForm && (
              <button className="next-turn-btn" onClick={handleNextTurn}>
                Next Turn
              </button>
            )}
            <button className="end-combat-btn" onClick={handleEndEncounter}>
              {showInitiativeForm ? 'Cancel' : 'End Combat'}
            </button>
          </div>

          <div className="add-entries-section">
            {showInitiativeForm && (
              <div>
                <h3>Add Player</h3>
                <form onSubmit={handleAddPlayer}>
                  <input
                    type="text"
                    value={newPlayer.name}
                    onChange={(e) => setNewPlayer({ ...newPlayer, name: e.target.value })}
                    placeholder="Player Name"
                  />
                  <input
                    type="number"
                    value={newPlayer.initiative}
                    onChange={(e) => setNewPlayer({ ...newPlayer, initiative: parseInt(e.target.value) })}
                    placeholder="Initiative"
                  />
                  <button type="submit">Add Player</button>
                </form>
              </div>
            )}

            <div>
              <h3>Add NPC</h3>
              <form onSubmit={handleAddCreature}>
                <input
                  type="text"
                  value={newCreature.name}
                  onChange={(e) => setNewCreature({ ...newCreature, name: e.target.value })}
                  placeholder="NPC Name"
                />
                <input
                  type="number"
                  value={newCreature.initiativeModifier}
                  onChange={(e) => setNewCreature({ ...newCreature, initiativeModifier: parseInt(e.target.value) })}
                  placeholder="Initiative Modifier"
                />
                <input
                  type="number"
                  value={newCreature.ac || ''}
                  onChange={(e) => setNewCreature({ ...newCreature, ac: parseInt(e.target.value) || undefined })}
                  placeholder="AC (optional)"
                />
                <input
                  type="number"
                  value={newCreature.hp || ''}
                  onChange={(e) => setNewCreature({ ...newCreature, hp: parseInt(e.target.value) || undefined })}
                  placeholder="HP (optional)"
                />
                <input
                  type="number"
                  value={newCreature.maxHp || ''}
                  onChange={(e) => setNewCreature({ ...newCreature, maxHp: parseInt(e.target.value) || undefined })}
                  placeholder="Max HP (optional)"
                />
                <button type="submit">Add NPC</button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 