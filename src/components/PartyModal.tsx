import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
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
  MessageSquare,
  Send,
  Lock,
  Unlock,
  ShieldAlert,
  ShieldCheck,
} from 'lucide-react';
import { Party, PartyMember, PartyPurpose, PartyMessage } from '../types';
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
  sendPartyMessage,
  subscribeToPartyMessages,
} from '../utils/partyService';
import { getOrCreateUserId, getOrCreateAvatarColor } from '../utils/firebase';
import { PomodoroTimerController } from '../utils/usePomodoroTimer';

interface PartyModalProps {
  isOpen: boolean;
  onClose: () => void;
  userName: string;
  initialTab?: PartyTab;
  onUpdateUserName?: (name: string) => void;
  onStartPomodoro?: () => void;
  pomodoroTimer?: PomodoroTimerController;
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
  pomodoroTimer,
}) => {
  const currentUserId = getOrCreateUserId();

  // Focus Session guard derived from Pomodoro controller
  const isFocusRunning = Boolean(pomodoroTimer?.isFocusRunning);
  const isInFocusSession = Boolean(pomodoroTimer?.isInFocusSession);
  const focusSessionStartTime = pomodoroTimer?.focusSessionStartTime ?? null;
  const pauseTimer = pomodoroTimer?.pauseTimer;

  const [activeTab, setActiveTab] = useState<PartyTab>('leaderboard');
  const [activeParty, setActiveParty] = useState<Party | null>(null);
  const [leaderboard, setLeaderboard] = useState<PartyMember[]>([]);
  const [userParties, setUserParties] = useState<Party[]>([]);
  const [isLoadingParties, setIsLoadingParties] = useState<boolean>(false);

  // Sub-view in Active Party Window: 'leaderboard' or 'chat'
  const [partyView, setPartyView] = useState<'leaderboard' | 'chat'>('leaderboard');
  const [showFocusLockAlert, setShowFocusLockAlert] = useState<boolean>(false);

  // Chat message feed & input state
  const [allMessages, setAllMessages] = useState<PartyMessage[]>([]);
  const [chatInput, setChatInput] = useState<string>('');
  const [isSendingMessage, setIsSendingMessage] = useState<boolean>(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Subscribe to real-time party messages
  useEffect(() => {
    if (!activeParty?.id) {
      setAllMessages([]);
      return;
    }
    const unsub = subscribeToPartyMessages(activeParty.id, (msgs) => {
      setAllMessages(msgs);
    });
    return () => unsub();
  }, [activeParty?.id]);

  // Condition 2: A user can receive messages ONLY when their focus session is over.
  // NOTE: The user cannot receive messages even if he pauses the focus session!
  const receivedMessages = useMemo(() => {
    if (!isInFocusSession || !focusSessionStartTime) {
      // Not in focus session (idle or on break or session over): all messages are received!
      return allMessages;
    }
    // In focus session (running OR paused):
    // Messages sent after focusSessionStartTime by others are NOT received yet!
    return allMessages.filter((msg) => {
      if (msg.senderId === currentUserId) return true; // User's own sent messages
      const msgTime = new Date(msg.createdAt).getTime();
      return msgTime < focusSessionStartTime;
    });
  }, [allMessages, isInFocusSession, focusSessionStartTime, currentUserId]);

  // Quarantined messages waiting for the focus session to finish
  const quarantinedMessages = useMemo(() => {
    if (!isInFocusSession || !focusSessionStartTime) {
      return [];
    }
    return allMessages.filter((msg) => {
      if (msg.senderId === currentUserId) return false;
      const msgTime = new Date(msg.createdAt).getTime();
      return msgTime >= focusSessionStartTime;
    });
  }, [allMessages, isInFocusSession, focusSessionStartTime, currentUserId]);

  // Track when focus session finishes so user gets an announcement when quarantined messages arrive
  const [unlockedNotice, setUnlockedNotice] = useState<string | null>(null);
  const prevInFocusSessionRef = useRef<boolean>(isInFocusSession);
  const prevQuarantinedCountRef = useRef<number>(quarantinedMessages.length);

  useEffect(() => {
    if (prevInFocusSessionRef.current && !isInFocusSession) {
      if (prevQuarantinedCountRef.current > 0) {
        setUnlockedNotice(
          `🎉 Focus session complete! ${prevQuarantinedCountRef.current} teammate message${
            prevQuarantinedCountRef.current === 1 ? '' : 's'
          } just arrived.`
        );
      }
    }
    prevInFocusSessionRef.current = isInFocusSession;
    prevQuarantinedCountRef.current = quarantinedMessages.length;
  }, [isInFocusSession, quarantinedMessages.length]);

  // Auto-scroll chat to bottom
  useEffect(() => {
    if (partyView === 'chat') {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [partyView, receivedMessages.length]);

  // Send message handler
  const handleSendMessage = async (customText?: string) => {
    const textToSend = (customText || chatInput).trim();
    if (!textToSend || !activeParty?.id || isSendingMessage) return;

    if (isFocusRunning) {
      setShowFocusLockAlert(true);
      return;
    }

    setIsSendingMessage(true);
    try {
      const userMember = leaderboard.find((m) => m.userId === currentUserId);
      const color = userMember?.avatarColor || getOrCreateAvatarColor();
      await sendPartyMessage(activeParty.id, textToSend, userName || 'Focus Friend', color);
      if (!customText) {
        setChatInput('');
      }
    } catch (err) {
      console.warn('Failed to send party message:', err);
    } finally {
      setIsSendingMessage(false);
    }
  };

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

              {/* Sub-view Switcher: Leaderboard vs Party Chat */}
              <div className="flex items-center gap-2 p-1 bg-neutral-950/80 border border-neutral-800 rounded-xl">
                <button
                  id="party-view-leaderboard-btn"
                  onClick={() => setPartyView('leaderboard')}
                  className={`flex-1 py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                    partyView === 'leaderboard'
                      ? 'bg-neutral-800 text-amber-300 shadow-sm'
                      : 'text-neutral-400 hover:text-neutral-200'
                  }`}
                >
                  <Trophy className="w-3.5 h-3.5 text-amber-400" />
                  <span>Leaderboard ({leaderboard.length})</span>
                </button>

                <button
                  id="party-view-chat-btn"
                  onClick={() => {
                    if (isFocusRunning) {
                      setShowFocusLockAlert(true);
                    } else {
                      setPartyView('chat');
                    }
                  }}
                  className={`flex-1 py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                    partyView === 'chat'
                      ? 'bg-neutral-800 text-sky-300 shadow-sm'
                      : isFocusRunning
                      ? 'text-neutral-500 hover:text-neutral-300 bg-neutral-900/60'
                      : 'text-neutral-400 hover:text-neutral-200'
                  }`}
                  title={
                    isFocusRunning
                      ? 'Chat is locked while focus session is running. Pause timer to open.'
                      : 'Open live party chat'
                  }
                >
                  {isFocusRunning ? (
                    <>
                      <Lock className="w-3.5 h-3.5 text-amber-500 animate-pulse" />
                      <span>Chat (Locked in Focus)</span>
                    </>
                  ) : (
                    <>
                      <MessageSquare className="w-3.5 h-3.5 text-sky-400" />
                      <span>Party Chat</span>
                      {quarantinedMessages.length > 0 && (
                        <span
                          className="text-[10px] font-mono px-1.5 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center gap-1"
                          title={`${quarantinedMessages.length} message(s) waiting in quarantine until your focus session ends`}
                        >
                          <span>📦</span>
                          <span>{quarantinedMessages.length} queued</span>
                        </span>
                      )}
                    </>
                  )}
                </button>
              </div>

              {/* SUB-VIEW 1: LEADERBOARD TABLE */}
              {partyView === 'leaderboard' && (
                <>
                  {/* Leaderboard Table / Rankings */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-semibold text-neutral-200 uppercase tracking-wider flex items-center gap-2">
                        <Trophy className="w-4 h-4 text-amber-400" />
                        <span>Focus Time Leaderboard</span>
                      </label>
                      <button
                        onClick={() => {
                          if (isFocusRunning) {
                            setShowFocusLockAlert(true);
                          } else {
                            setPartyView('chat');
                          }
                        }}
                        className="text-[11px] text-sky-400 hover:text-sky-300 flex items-center gap-1 cursor-pointer transition-colors"
                      >
                        <MessageSquare className="w-3 h-3" />
                        <span>Open Chat</span>
                      </button>
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
                </>
              )}

              {/* SUB-VIEW 2: PARTY CHAT */}
              {partyView === 'chat' && (
                <div className="space-y-4 animate-fadeIn">
                  {/* Condition 1 Focus Running Guard Overlay */}
                  {isFocusRunning ? (
                    <div className="p-8 text-center rounded-2xl bg-neutral-950/90 border border-amber-500/30 shadow-lg space-y-4">
                      <div className="w-12 h-12 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-400 flex items-center justify-center mx-auto">
                        <Lock className="w-6 h-6 animate-pulse" />
                      </div>
                      <div>
                        <h4 className="text-base font-bold text-white">Focus Session in Progress</h4>
                        <p className="text-xs text-neutral-400 mt-1 max-w-sm mx-auto">
                          Chat is locked to protect your deep concentration while the Pomodoro timer is running. You can pause the timer to access chat.
                        </p>
                      </div>
                      <div className="flex items-center justify-center gap-3 pt-2">
                        <button
                          onClick={() => pauseTimer?.()}
                          className="px-4 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-neutral-950 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer shadow-md"
                        >
                          <span>⏸️ Pause Timer & Chat</span>
                        </button>
                        <button
                          onClick={() => setPartyView('leaderboard')}
                          className="px-4 py-2 rounded-xl border border-neutral-800 hover:bg-neutral-800 text-neutral-300 text-xs font-medium transition-colors cursor-pointer"
                        >
                          <span>View Leaderboard</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      {/* Chat Focus Protection Status Banner */}
                      {isInFocusSession ? (
                        <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-start gap-2.5">
                          <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                          <div className="flex-1">
                            <div className="font-semibold flex items-center justify-between">
                              <span>Focus Shield Active (Timer Paused)</span>
                              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                                Quarantine Enforced
                              </span>
                            </div>
                            <p className="text-[11px] text-neutral-300 mt-1">
                              You can chat while paused. However, <strong>incoming messages from others are held in quarantine</strong> and will only be received when your focus session is completely over.
                            </p>
                            {quarantinedMessages.length > 0 && (
                              <div className="mt-2 pt-2 border-t border-amber-500/20 flex items-center gap-1.5 font-mono text-[11px] text-amber-200 font-semibold">
                                <span>📦</span>
                                <span>{quarantinedMessages.length} teammate message{quarantinedMessages.length === 1 ? '' : 's'} waiting in quarantine</span>
                              </div>
                            )}
                          </div>
                        </div>
                      ) : (
                        <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                            <span className="text-neutral-200 text-[11px]">
                              {receivedMessages.length > 0
                                ? 'Focus session complete or idle. All party messages are received in real time.'
                                : 'Live party chat active. Messages are delivered in real time.'}
                            </span>
                          </div>
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                            Live
                          </span>
                        </div>
                      )}

                      {/* Unlocked Quarantine Notification Banner */}
                      {unlockedNotice && (
                        <div className="p-3 rounded-xl bg-gradient-to-r from-amber-500/20 via-emerald-500/20 to-sky-500/20 border border-emerald-400/40 text-emerald-200 text-xs flex items-center justify-between gap-2 animate-fadeIn shadow-md">
                          <div className="flex items-center gap-2">
                            <Sparkles className="w-4 h-4 text-emerald-400 shrink-0 animate-spin" />
                            <span className="font-medium text-[11px]">{unlockedNotice}</span>
                          </div>
                          <button
                            onClick={() => setUnlockedNotice(null)}
                            className="p-1 rounded hover:bg-neutral-800 text-neutral-400 hover:text-white cursor-pointer"
                            aria-label="Dismiss notice"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}

                      {/* Chat Messages Feed Container */}
                      <div className="h-[280px] overflow-y-auto space-y-3 p-4 rounded-2xl bg-neutral-950/80 border border-neutral-800 shadow-inner">
                        {receivedMessages.length === 0 ? (
                          <div className="h-full flex flex-col items-center justify-center text-center p-4 text-neutral-500 space-y-2">
                            <MessageSquare className="w-8 h-8 text-neutral-600 opacity-60" />
                            <p className="text-xs text-neutral-400">No messages in this party yet.</p>
                            <p className="text-[11px] text-neutral-500 max-w-xs">
                              Say hi to your study partners or send a quick focus cheer below!
                            </p>
                          </div>
                        ) : (
                          receivedMessages.map((msg) => {
                            const isMe = msg.senderId === currentUserId;
                            const timeStr = new Date(msg.createdAt).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            });

                            return (
                              <div
                                key={msg.id}
                                className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} space-y-1`}
                              >
                                <div className="flex items-center gap-1.5 text-[10px] text-neutral-400 px-1">
                                  {!isMe && (
                                    <span
                                      className="w-2 h-2 rounded-full inline-block"
                                      style={{ backgroundColor: msg.senderAvatarColor || '#38bdf8' }}
                                    />
                                  )}
                                  <span className={isMe ? 'text-amber-400 font-semibold' : 'text-neutral-300 font-medium'}>
                                    {isMe ? 'You' : msg.senderName}
                                  </span>
                                  <span>•</span>
                                  <span>{timeStr}</span>
                                </div>

                                <div
                                  className={`max-w-[85%] px-3.5 py-2 rounded-2xl text-xs break-words shadow-sm ${
                                    isMe
                                      ? 'bg-amber-400/20 border border-amber-400/40 text-neutral-100 rounded-tr-xs'
                                      : 'bg-neutral-900 border border-neutral-800 text-neutral-200 rounded-tl-xs'
                                  }`}
                                >
                                  {msg.text}
                                </div>
                              </div>
                            );
                          })
                        )}
                        <div ref={messagesEndRef} />
                      </div>

                      {/* Quick Focus Reaction Cheers */}
                      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs no-scrollbar">
                        <span className="text-[10px] uppercase font-mono text-neutral-500 shrink-0">Cheers:</span>
                        {['🔥 Locked in!', '💪 Keep pushing!', '☕ Quick break', '🎯 Pomodoro done!', '👋 Hey team!'].map((cheer) => (
                          <button
                            key={cheer}
                            type="button"
                            onClick={() => handleSendMessage(cheer)}
                            className="px-2.5 py-1 rounded-full bg-neutral-900 hover:bg-neutral-800 border border-neutral-700/80 text-neutral-300 text-[11px] whitespace-nowrap transition-colors cursor-pointer shrink-0"
                          >
                            {cheer}
                          </button>
                        ))}
                      </div>

                      {/* Message Input Form */}
                      <form
                        onSubmit={(e) => {
                          e.preventDefault();
                          handleSendMessage();
                        }}
                        className="flex items-center gap-2 pt-1"
                      >
                        <input
                          type="text"
                          value={chatInput}
                          onChange={(e) => setChatInput(e.target.value)}
                          placeholder={
                            isInFocusSession
                              ? "Message party... (incoming messages reveal after session ends)"
                              : "Message the party... (Enter to send)"
                          }
                          className="flex-1 px-4 py-2.5 rounded-xl bg-neutral-950 border border-neutral-800 text-neutral-100 text-xs placeholder:text-neutral-500 focus:outline-none focus:border-amber-400/60 transition-colors"
                          disabled={isSendingMessage}
                        />
                        <button
                          type="submit"
                          disabled={!chatInput.trim() || isSendingMessage}
                          className={`px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                            chatInput.trim() && !isSendingMessage
                              ? 'bg-amber-400 hover:bg-amber-300 text-neutral-950 shadow-md'
                              : 'bg-neutral-800 text-neutral-500 cursor-not-allowed'
                          }`}
                        >
                          <Send className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">Send</span>
                        </button>
                      </form>
                    </>
                  )}
                </div>
              )}
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

      {/* Focus Guard Dialog: Chat Locked during active focus */}
      {showFocusLockAlert && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-neutral-900 border border-amber-500/40 rounded-2xl max-w-sm w-full p-6 shadow-2xl space-y-4 text-center">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-400 flex items-center justify-center mx-auto">
              <Lock className="w-6 h-6 animate-pulse" />
            </div>

            <div>
              <h3 className="text-base font-bold text-white tracking-tight">
                Chat Locked During Focus
              </h3>
              <p className="text-xs text-neutral-300 mt-2 leading-relaxed">
                To protect your deep work and concentration flow, chat is locked while your focus timer is actively running.
              </p>
              <p className="text-[11px] text-amber-400/90 font-medium mt-1">
                You can pause your focus session anytime to open chat.
              </p>
            </div>

            <div className="space-y-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  pauseTimer?.();
                  setPartyView('chat');
                  setShowFocusLockAlert(false);
                }}
                className="w-full py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-neutral-950 font-bold text-xs tracking-wide transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <span>⏸️ Pause Focus & Open Chat</span>
              </button>

              <button
                type="button"
                onClick={() => setShowFocusLockAlert(false)}
                className="w-full py-2 rounded-xl border border-neutral-800 hover:bg-neutral-800 text-neutral-400 hover:text-white text-xs transition-colors cursor-pointer"
              >
                <span>Keep Focusing</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
