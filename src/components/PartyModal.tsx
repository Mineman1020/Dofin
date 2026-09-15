import React, { useState, useEffect, useCallback } from 'react';
import {
  X,
  Users,
  Trophy,
  Crown,
  Copy,
  Check,
  Plus,
  LogIn,
  LogOut,
  Flame,
  Sparkles,
  Clock,
  BookOpen,
  Briefcase,
  Code,
  Palette,
  Share2,
  RefreshCw,
  AlertCircle,
  ExternalLink,
} from 'lucide-react';
import { Party, PartyMember, PartyPurpose } from '../types';
import {
  getSavedPartyIds,
  getActivePartyId,
  setActivePartyId,
  createParty,
  joinParty,
  leaveParty,
  subscribeToParty,
  subscribeToLeaderboard,
  fetchUserParties,
} from '../utils/partyService';
import { getOrCreateUserId } from '../utils/firebase';

interface PartyModalProps {
  isOpen: boolean;
  onClose: () => void;
  userName: string;
  initialTab?: PartyTab;
  onUpdateUserName?: (name: string) => void;
  onStartPomodoro?: () => void;
}

type PartyTab = 'leaderboard' | 'my-parties' | 'create' | 'join';

const PURPOSE_CONFIG: Record<
  PartyPurpose,
  { label: string; icon: React.ComponentType<{ className?: string }>; color: string }
> = {
  study: { label: 'Study Group', icon: BookOpen, color: 'text-amber-400 bg-amber-400/10 border-amber-400/30' },
  work: { label: 'Deep Work', icon: Briefcase, color: 'text-sky-400 bg-sky-400/10 border-sky-400/30' },
  coding: { label: 'Coding Sprint', icon: Code, color: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/30' },
  reading: { label: 'Reading Room', icon: BookOpen, color: 'text-purple-400 bg-purple-400/10 border-purple-400/30' },
  creative: { label: 'Creative Studio', icon: Palette, color: 'text-pink-400 bg-pink-400/10 border-pink-400/30' },
  general: { label: 'Focus Club', icon: Flame, color: 'text-orange-400 bg-orange-400/10 border-orange-400/30' },
};

export const PartyModal: React.FC<PartyModalProps> = ({
  isOpen,
  onClose,
  userName,
  initialTab,
  onUpdateUserName,
  onStartPomodoro,
}) => {
  const currentUserId = getOrCreateUserId();

  const [activeTab, setActiveTab] = useState<PartyTab>('leaderboard');
  const [activeParty, setActiveParty] = useState<Party | null>(null);
  const [leaderboard, setLeaderboard] = useState<PartyMember[]>([]);
  const [userParties, setUserParties] = useState<Party[]>([]);
  const [isLoadingParties, setIsLoadingParties] = useState<boolean>(false);

  // Form states: Create
  const [createName, setCreateName] = useState('');
  const [createDescription, setCreateDescription] = useState('');
  const [createPurpose, setCreatePurpose] = useState<PartyPurpose>('study');
  const [createHostName, setCreateHostName] = useState(userName || 'Host');
  const [isCreating, setIsCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  // Form states: Join
  const [joinCode, setJoinCode] = useState('');
  const [joinName, setJoinName] = useState(userName || 'Friend');
  const [isJoining, setIsJoining] = useState(false);
  const [joinError, setJoinError] = useState<string | null>(null);

  // Feedback states
  const [copiedCode, setCopiedCode] = useState(false);

  // Refresh saved parties list
  const refreshUserParties = useCallback(async () => {
    setIsLoadingParties(true);
    try {
      const savedIds = getSavedPartyIds();
      if (savedIds.length > 0) {
        const parties = await fetchUserParties(savedIds);
        setUserParties(parties);

        // If no active party is selected, choose the first one
        const activeId = getActivePartyId();
        if (!activeId || !savedIds.includes(activeId)) {
          if (parties.length > 0) {
            setActivePartyId(parties[0].id);
            setActiveParty(parties[0]);
          } else {
            setActivePartyId(null);
            setActiveParty(null);
          }
        }
      } else {
        setUserParties([]);
        setActiveParty(null);
        setActivePartyId(null);
      }
    } catch (e) {
      console.warn('Error fetching parties:', e);
    } finally {
      setIsLoadingParties(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      refreshUserParties();
      if (initialTab) {
        setActiveTab(initialTab);
      } else {
        const activeId = getActivePartyId();
        if (!activeId) {
          const saved = getSavedPartyIds();
          if (saved.length === 0) {
            setActiveTab('create');
          } else {
            setActiveTab('my-parties');
          }
        } else {
          setActiveTab('leaderboard');
        }
      }
    }
  }, [isOpen, initialTab, refreshUserParties]);

  // Real-time subscription to active party details & members
  useEffect(() => {
    const activeId = getActivePartyId();
    if (!activeId || !isOpen) return;

    const unsubParty = subscribeToParty(activeId, (party) => {
      setActiveParty(party);
      if (!party) {
        // Party was deleted or not found
        refreshUserParties();
      }
    });

    const unsubMembers = subscribeToLeaderboard(activeId, (members) => {
      setLeaderboard(members);
    });

    return () => {
      unsubParty();
      unsubMembers();
    };
  }, [isOpen, activeTab]);

  if (!isOpen) return null;

  // Handle Copy Code
  const handleCopyCode = (code: string) => {
    if (!navigator.clipboard) return;
    navigator.clipboard.writeText(code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2500);
  };

  // Handle Create Party submit
  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createName.trim()) {
      setCreateError('Please enter a party name');
      return;
    }
    setIsCreating(true);
    setCreateError(null);
    try {
      const newParty = await createParty({
        name: createName,
        description: createDescription,
        purpose: createPurpose,
        userName: createHostName.trim() || userName || 'Host',
      });
      if (onUpdateUserName && createHostName.trim()) {
        onUpdateUserName(createHostName.trim());
      }
      setActiveParty(newParty);
      await refreshUserParties();
      setActiveTab('leaderboard');
      setCreateName('');
      setCreateDescription('');
    } catch (err: unknown) {
      setCreateError(err instanceof Error ? err.message : 'Failed to create party.');
    } finally {
      setIsCreating(false);
    }
  };

  // Handle Join Party submit
  const handleJoinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!joinCode.trim()) {
      setJoinError('Please enter a party code');
      return;
    }
    setIsJoining(true);
    setJoinError(null);
    try {
      const joined = await joinParty(joinCode, joinName.trim() || userName || 'Focus Friend');
      if (onUpdateUserName && joinName.trim()) {
        onUpdateUserName(joinName.trim());
      }
      setActiveParty(joined);
      await refreshUserParties();
      setActiveTab('leaderboard');
      setJoinCode('');
    } catch (err: unknown) {
      setJoinError(err instanceof Error ? err.message : 'Could not join party. Check the code.');
    } finally {
      setIsJoining(false);
    }
  };

  // Handle Leave Party
  const handleLeaveParty = async (partyId: string) => {
    if (!window.confirm('Are you sure you want to leave this party? You can re-join anytime with the party code.')) {
      return;
    }
    try {
      await leaveParty(partyId);
      await refreshUserParties();
      const remaining = getSavedPartyIds();
      if (remaining.length > 0) {
        setActivePartyId(remaining[0]);
        setActiveTab('leaderboard');
      } else {
        setActiveTab('create');
      }
    } catch (err) {
      console.warn('Error leaving party:', err);
    }
  };

  // Switch to a specific party
  const handleSelectParty = (party: Party) => {
    setActivePartyId(party.id);
    setActiveParty(party);
    setActiveTab('leaderboard');
  };

  const currentPurpose = activeParty ? PURPOSE_CONFIG[activeParty.purpose] || PURPOSE_CONFIG.study : PURPOSE_CONFIG.study;
  const PurposeIcon = currentPurpose.icon;

  const maxMinutesInLeaderboard = leaderboard.length > 0 ? Math.max(1, leaderboard[0].totalFocusMinutes) : 1;

  return (
    <div
      id="party-modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-md animate-fadeIn"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        id="party-modal-container"
        className="w-full max-w-2xl max-h-[92vh] bg-neutral-900 border border-neutral-800 text-neutral-100 rounded-2xl shadow-2xl flex flex-col overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-800 bg-neutral-900/95">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30">
              <Users className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-semibold text-white tracking-tight">
                  Study & Work Parties
                </h2>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                  Live Sync
                </span>
              </div>
              <p className="text-[11px] text-neutral-400">
                Study together with friends using shared codes & real-time focus leaderboards
              </p>
            </div>
          </div>

          <button
            id="party-modal-close-btn"
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors cursor-pointer"
            aria-label="Close party hub"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-neutral-800 bg-neutral-950/60 px-6 pt-2 overflow-x-auto scrollbar-none">
          {activeParty && (
            <button
              id="tab-party-leaderboard-btn"
              onClick={() => setActiveTab('leaderboard')}
              className={`flex items-center gap-2 pb-3 px-3 text-xs font-medium border-b-2 transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'leaderboard'
                  ? 'border-amber-400 text-amber-400'
                  : 'border-transparent text-neutral-400 hover:text-neutral-200'
              }`}
            >
              <Trophy className="w-3.5 h-3.5" />
              <span>Leaderboard</span>
            </button>
          )}

          <button
            id="tab-party-my-parties-btn"
            onClick={() => {
              setActiveTab('my-parties');
              refreshUserParties();
            }}
            className={`flex items-center gap-2 pb-3 px-3 text-xs font-medium border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'my-parties'
                ? 'border-amber-400 text-amber-400'
                : 'border-transparent text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Your Parties ({userParties.length})</span>
          </button>

          <button
            id="tab-party-create-btn"
            onClick={() => setActiveTab('create')}
            className={`flex items-center gap-2 pb-3 px-3 text-xs font-medium border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'create'
                ? 'border-amber-400 text-amber-400'
                : 'border-transparent text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Create Party</span>
          </button>

          <button
            id="tab-party-join-btn"
            onClick={() => setActiveTab('join')}
            className={`flex items-center gap-2 pb-3 px-3 text-xs font-medium border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'join'
                ? 'border-amber-400 text-amber-400'
                : 'border-transparent text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <LogIn className="w-3.5 h-3.5" />
            <span>Join Party</span>
          </button>
        </div>

        {/* Tab Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 text-sm">
          {/* TAB 1: LEADERBOARD & ACTIVE PARTY */}
          {activeTab === 'leaderboard' && activeParty && (
            <div className="space-y-6 animate-fadeIn">
              {/* Active Party Information Card */}
              <div className="p-4 rounded-2xl bg-neutral-950/80 border border-neutral-800 shadow-md">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span
                        className={`text-[10px] font-mono px-2 py-0.5 rounded-full border flex items-center gap-1 ${currentPurpose.color}`}
                      >
                        <PurposeIcon className="w-3 h-3" />
                        <span>{currentPurpose.label}</span>
                      </span>
                      <span className="text-xs text-neutral-400">
                        {leaderboard.length} {leaderboard.length === 1 ? 'member' : 'members'}
                      </span>
                    </div>
                    <h3 className="text-lg font-bold text-white tracking-tight">
                      {activeParty.name}
                    </h3>
                    {activeParty.description && (
                      <p className="text-xs text-neutral-400 mt-1 max-w-md">
                        {activeParty.description}
                      </p>
                    )}
                  </div>

                  {/* Party Code Share Chip */}
                  <div className="flex items-center gap-2 bg-neutral-900 border border-neutral-700/80 p-2 rounded-xl self-start sm:self-auto">
                    <div className="text-left pr-2 border-r border-neutral-800">
                      <span className="text-[9px] uppercase tracking-wider text-neutral-400 block font-mono">
                        Party Code
                      </span>
                      <span className="text-base font-mono font-bold text-amber-400 tracking-wider">
                        {activeParty.code}
                      </span>
                    </div>

                    <button
                      id="party-copy-code-btn"
                      onClick={() => handleCopyCode(activeParty.code)}
                      className="px-2.5 py-1.5 rounded-lg bg-amber-400/20 hover:bg-amber-400/30 text-amber-300 text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
                      title="Copy party code to share with friends"
                    >
                      {copiedCode ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                          <span className="text-emerald-300">Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copy</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Quick actions bar */}
                <div className="flex items-center justify-between mt-4 pt-3 border-t border-neutral-800/80 text-xs text-neutral-400">
                  <div className="flex items-center gap-2">
                    <span>Host: <strong className="text-neutral-300">{activeParty.createdByName}</strong></span>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => handleLeaveParty(activeParty.id)}
                      className="text-red-400/80 hover:text-red-300 flex items-center gap-1 transition-colors cursor-pointer"
                    >
                      <LogOut className="w-3 h-3" />
                      <span>Leave Party</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Leaderboard Table / Rankings */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-neutral-200 uppercase tracking-wider flex items-center gap-2">
                    <Trophy className="w-4 h-4 text-amber-400" />
                    <span>Focus Time Leaderboard</span>
                  </label>
                  <span className="text-[11px] text-neutral-400">
                    Ranked by total Pomodoro minutes
                  </span>
                </div>

                {leaderboard.length === 0 ? (
                  <div className="p-8 text-center rounded-2xl bg-neutral-950/40 border border-neutral-800 text-neutral-400">
                    <RefreshCw className="w-6 h-6 mx-auto mb-2 animate-spin text-amber-400/60" />
                    <p className="text-xs">Connecting to live party leaderboard...</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {leaderboard.map((member, index) => {
                      const isCurrentUser = member.userId === currentUserId;
                      const isFirst = index === 0;
                      const isSecond = index === 1;
                      const isThird = index === 2;

                      // Format total time nicely
                      const hrs = Math.floor(member.totalFocusMinutes / 60);
                      const mins = member.totalFocusMinutes % 60;
                      const formattedTime =
                        hrs > 0
                          ? `${hrs}h ${mins}m`
                          : `${mins} mins`;

                      const percent = Math.min(100, Math.round((member.totalFocusMinutes / maxMinutesInLeaderboard) * 100));

                      return (
                        <div
                          key={member.id}
                          className={`p-3.5 rounded-xl border transition-all relative overflow-hidden flex items-center justify-between gap-3 ${
                            isCurrentUser
                              ? 'bg-amber-400/10 border-amber-400/40 shadow-sm'
                              : isFirst
                              ? 'bg-neutral-950/90 border-amber-500/30'
                              : 'bg-neutral-950/50 border-neutral-800'
                          }`}
                        >
                          {/* Relative background progress bar */}
                          <div
                            className="absolute left-0 top-0 bottom-0 bg-amber-400/5 transition-all duration-500 pointer-events-none"
                            style={{ width: `${percent}%` }}
                          />

                          {/* Left: Rank + Avatar + Name + Live Status */}
                          <div className="flex items-center gap-3 relative z-10 min-w-0">
                            {/* Rank Badge */}
                            <div className="w-6 text-center font-mono font-bold text-sm">
                              {isFirst ? (
                                <Crown className="w-5 h-5 text-amber-400 mx-auto fill-amber-400/20" />
                              ) : isSecond ? (
                                <span className="text-neutral-300 font-bold">#2</span>
                              ) : isThird ? (
                                <span className="text-amber-600/90 font-bold">#3</span>
                              ) : (
                                <span className="text-neutral-400 text-xs">#{index + 1}</span>
                              )}
                            </div>

                            {/* Avatar */}
                            <div
                              className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-neutral-950 text-xs flex-shrink-0 shadow-inner"
                              style={{ backgroundColor: member.avatarColor || '#f59e0b' }}
                            >
                              {(member.name || 'F')[0].toUpperCase()}
                            </div>

                            {/* Name & Status */}
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5">
                                <span className="text-sm font-semibold text-neutral-100 truncate">
                                  {member.name}
                                </span>
                                {isCurrentUser && (
                                  <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-amber-400/20 text-amber-300 border border-amber-400/30 flex-shrink-0">
                                    You
                                  </span>
                                )}
                              </div>

                              {/* Real-time status dot */}
                              <div className="flex items-center gap-1.5 text-[11px] text-neutral-400">
                                {member.currentStatus === 'focusing' ? (
                                  <>
                                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                                    <span className="text-emerald-400 font-medium">In Focus Session</span>
                                  </>
                                ) : member.currentStatus === 'break' ? (
                                  <>
                                    <span className="w-2 h-2 rounded-full bg-sky-400" />
                                    <span className="text-sky-300">Taking a Break</span>
                                  </>
                                ) : (
                                  <>
                                    <span className="w-2 h-2 rounded-full bg-neutral-600" />
                                    <span className="text-neutral-400">Idle</span>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Right: Pomodoro count & Focus Time */}
                          <div className="flex items-center gap-3 relative z-10 text-right flex-shrink-0">
                            <div className="text-[11px] text-neutral-400 hidden sm:block">
                              <span className="font-mono text-neutral-300 font-semibold">
                                {member.completedSessions}
                              </span>{' '}
                              <span>sessions</span>
                            </div>

                            <div className="bg-neutral-900 border border-neutral-700/80 px-3 py-1.5 rounded-lg text-right min-w-[80px]">
                              <span className="text-xs font-mono font-bold text-amber-400 block">
                                {formattedTime}
                              </span>
                              <span className="text-[9px] uppercase tracking-wider text-neutral-400 block font-mono">
                                Total Focus
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Action: Start Focusing */}
              <div className="p-4 rounded-xl bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border border-amber-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Flame className="w-5 h-5 text-amber-400 flex-shrink-0" />
                  <div className="text-xs">
                    <span className="font-semibold text-neutral-100 block">
                      Want to climb the ranks?
                    </span>
                    <span className="text-neutral-400 block mt-0.5">
                      Run your Pomodoro timer. Every minute you study automatically syncs to this party!
                    </span>
                  </div>
                </div>

                {onStartPomodoro && (
                  <button
                    onClick={() => {
                      onClose();
                      onStartPomodoro();
                    }}
                    className="px-4 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-neutral-950 text-xs font-semibold tracking-wide transition-all shadow cursor-pointer whitespace-nowrap flex items-center justify-center gap-1.5"
                  >
                    <Clock className="w-3.5 h-3.5" />
                    <span>Open Pomodoro Timer</span>
                  </button>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: YOUR PARTIES */}
          {activeTab === 'my-parties' && (
            <div className="space-y-4 animate-fadeIn">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-white">Your Joined & Created Parties</h3>
                  <p className="text-xs text-neutral-400">
                    Parties exist continuously until you choose to leave them.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={refreshUserParties}
                    className="p-1.5 rounded-lg border border-neutral-800 hover:bg-neutral-800 text-neutral-400 hover:text-white transition-colors cursor-pointer"
                    title="Refresh party list"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isLoadingParties ? 'animate-spin' : ''}`} />
                  </button>
                </div>
              </div>

              {userParties.length === 0 ? (
                <div className="p-8 text-center rounded-2xl bg-neutral-950/40 border border-neutral-800 space-y-4">
                  <div className="w-12 h-12 rounded-2xl bg-amber-400/10 text-amber-400 mx-auto flex items-center justify-center border border-amber-400/20">
                    <Users className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-neutral-200">No parties joined yet</h4>
                    <p className="text-xs text-neutral-400 mt-1 max-w-sm mx-auto">
                      Create your own study party to get a code, or join a friend&apos;s existing room.
                    </p>
                  </div>
                  <div className="flex items-center justify-center gap-3 pt-2">
                    <button
                      onClick={() => setActiveTab('create')}
                      className="px-4 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-neutral-950 text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Create a Party</span>
                    </button>
                    <button
                      onClick={() => setActiveTab('join')}
                      className="px-4 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-medium flex items-center gap-1.5 cursor-pointer"
                    >
                      <LogIn className="w-3.5 h-3.5" />
                      <span>Join with Code</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-3">
                  {userParties.map((party) => {
                    const isSelected = activeParty?.id === party.id;
                    const purposeInfo = PURPOSE_CONFIG[party.purpose] || PURPOSE_CONFIG.study;
                    const Icon = purposeInfo.icon;
                    const isCreator = party.createdBy === currentUserId;

                    return (
                      <div
                        key={party.id}
                        className={`p-4 rounded-xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                          isSelected
                            ? 'bg-amber-400/10 border-amber-400/50 shadow-md ring-1 ring-amber-400/20'
                            : 'bg-neutral-950/60 border-neutral-800 hover:border-neutral-700'
                        }`}
                      >
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span
                              className={`text-[10px] font-mono px-2 py-0.5 rounded-full border flex items-center gap-1 ${purposeInfo.color}`}
                            >
                              <Icon className="w-3 h-3" />
                              <span>{purposeInfo.label}</span>
                            </span>
                            <span className="text-[11px] font-mono text-amber-400 font-semibold">
                              {party.code}
                            </span>
                            {isCreator && (
                              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-neutral-800 text-neutral-300">
                                Host
                              </span>
                            )}
                          </div>
                          <h4 className="text-sm font-bold text-white">{party.name}</h4>
                          {party.description && (
                            <p className="text-xs text-neutral-400 mt-0.5 line-clamp-1">
                              {party.description}
                            </p>
                          )}
                        </div>

                        <div className="flex items-center gap-2 self-end sm:self-auto">
                          <button
                            onClick={() => handleSelectParty(party)}
                            className={`px-3 py-1.5 rounded-xl text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer ${
                              isSelected
                                ? 'bg-amber-400 text-neutral-950 font-semibold'
                                : 'bg-neutral-800 hover:bg-neutral-700 text-neutral-200'
                            }`}
                          >
                            <Trophy className="w-3 h-3" />
                            <span>{isSelected ? 'Viewing' : 'View Leaderboard'}</span>
                          </button>

                          <button
                            onClick={() => handleLeaveParty(party.id)}
                            className="p-1.5 rounded-xl text-neutral-400 hover:text-red-400 hover:bg-neutral-800/80 transition-colors cursor-pointer"
                            title="Leave Party"
                          >
                            <LogOut className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: CREATE PARTY */}
          {activeTab === 'create' && (
            <form onSubmit={handleCreateSubmit} className="space-y-4 animate-fadeIn">
              <div>
                <h3 className="text-sm font-semibold text-white">Create a New Study or Work Party</h3>
                <p className="text-xs text-neutral-400">
                  You will receive a unique code to share with friends. The party will persist until you leave it.
                </p>
              </div>

              {createError && (
                <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{createError}</span>
                </div>
              )}

              {/* Party Name */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-neutral-300 uppercase tracking-wider block">
                  Party Name *
                </label>
                <input
                  type="text"
                  required
                  maxLength={60}
                  value={createName}
                  onChange={(e) => setCreateName(e.target.value)}
                  placeholder="e.g. Late Night Finals Cram, Sprint Week, Morning Reading"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-950 border border-neutral-800 focus:border-amber-400 focus:ring-1 focus:ring-amber-400 text-neutral-100 placeholder:text-neutral-500 text-sm outline-none transition-all"
                />
              </div>

              {/* Purpose Category Selection */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-neutral-300 uppercase tracking-wider block">
                  Why is this party created? (Purpose)
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {(Object.keys(PURPOSE_CONFIG) as PartyPurpose[]).map((purposeKey) => {
                    const item = PURPOSE_CONFIG[purposeKey];
                    const Icon = item.icon;
                    const isSelected = createPurpose === purposeKey;
                    return (
                      <button
                        type="button"
                        key={purposeKey}
                        onClick={() => setCreatePurpose(purposeKey)}
                        className={`p-2.5 rounded-xl border text-left flex items-center gap-2.5 transition-all cursor-pointer ${
                          isSelected
                            ? 'border-amber-400 bg-amber-400/15 text-amber-300 ring-1 ring-amber-400/20'
                            : 'border-neutral-800 hover:border-neutral-700 bg-neutral-950 text-neutral-300'
                        }`}
                      >
                        <Icon className="w-4 h-4 flex-shrink-0" />
                        <span className="text-xs font-medium">{item.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Description */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-neutral-300 uppercase tracking-wider block">
                  Description & Goals (Optional)
                </label>
                <textarea
                  rows={2}
                  maxLength={250}
                  value={createDescription}
                  onChange={(e) => setCreateDescription(e.target.value)}
                  placeholder="Rules, goals, target topics, or study expectations..."
                  className="w-full px-3.5 py-2 rounded-xl bg-neutral-950 border border-neutral-800 focus:border-amber-400 focus:ring-1 focus:ring-amber-400 text-neutral-100 placeholder:text-neutral-500 text-sm outline-none transition-all resize-none"
                />
              </div>

              {/* Host Display Name */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-neutral-300 uppercase tracking-wider block">
                  Your Display Name
                </label>
                <input
                  type="text"
                  maxLength={30}
                  value={createHostName}
                  onChange={(e) => setCreateHostName(e.target.value)}
                  placeholder="Your nickname on the leaderboard"
                  className="w-full px-3.5 py-2 rounded-xl bg-neutral-950 border border-neutral-800 focus:border-amber-400 focus:ring-1 focus:ring-amber-400 text-neutral-100 placeholder:text-neutral-500 text-sm outline-none transition-all"
                />
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isCreating}
                className="w-full py-3 rounded-xl bg-amber-400 hover:bg-amber-300 disabled:opacity-50 text-neutral-950 font-semibold text-sm transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
              >
                {isCreating ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Creating Party...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Create Party & Generate Code</span>
                  </>
                )}
              </button>
            </form>
          )}

          {/* TAB 4: JOIN PARTY */}
          {activeTab === 'join' && (
            <form onSubmit={handleJoinSubmit} className="space-y-4 animate-fadeIn">
              <div>
                <h3 className="text-sm font-semibold text-white">Join an Existing Party</h3>
                <p className="text-xs text-neutral-400">
                  Enter the 6-character party code provided by your host or friend.
                </p>
              </div>

              {joinError && (
                <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{joinError}</span>
                </div>
              )}

              {/* Party Code */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-neutral-300 uppercase tracking-wider block">
                  Party Code *
                </label>
                <input
                  type="text"
                  required
                  maxLength={12}
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                  placeholder="e.g. ST-4820 or FOCUS9"
                  className="w-full px-3.5 py-3 rounded-xl bg-neutral-950 border border-neutral-800 focus:border-amber-400 focus:ring-1 focus:ring-amber-400 text-neutral-100 placeholder:text-neutral-600 text-base font-mono uppercase tracking-widest outline-none transition-all text-center"
                />
              </div>

              {/* Display Name */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-neutral-300 uppercase tracking-wider block">
                  Your Display Name on the Leaderboard
                </label>
                <input
                  type="text"
                  maxLength={30}
                  value={joinName}
                  onChange={(e) => setJoinName(e.target.value)}
                  placeholder="Your name or handle"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-950 border border-neutral-800 focus:border-amber-400 focus:ring-1 focus:ring-amber-400 text-neutral-100 placeholder:text-neutral-500 text-sm outline-none transition-all"
                />
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={isJoining}
                className="w-full py-3 rounded-xl bg-amber-400 hover:bg-amber-300 disabled:opacity-50 text-neutral-950 font-semibold text-sm transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
              >
                {isJoining ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Joining Party...</span>
                  </>
                ) : (
                  <>
                    <LogIn className="w-4 h-4" />
                    <span>Join Party & View Leaderboard</span>
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
