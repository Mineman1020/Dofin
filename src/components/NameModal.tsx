import React, { useState } from 'react';
import { Sparkles, ArrowRight, User } from 'lucide-react';

interface NameModalProps {
  isOpen: boolean;
  currentName: string;
  onSave: (name: string) => void;
  onClose?: () => void;
  canDismiss?: boolean;
}

export const NameModal: React.FC<NameModalProps> = ({
  isOpen,
  currentName,
  onSave,
  onClose,
  canDismiss = false,
}) => {
  const [name, setName] = useState(currentName);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) {
      setError('Please enter a name to continue');
      return;
    }
    setError('');
    onSave(trimmed);
  };

  return (
    <div
      id="name-modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn"
    >
      <div
        id="name-modal-card"
        className="w-full max-w-md bg-neutral-900 border border-neutral-800 text-neutral-100 rounded-2xl p-7 shadow-2xl relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 w-36 h-36 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-36 h-36 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-semibold tracking-tight text-white">
              {currentName ? 'Update Your Name' : 'Welcome to Desk Clock'}
            </h2>
            <p className="text-xs text-neutral-400">
              Personalize your ambient desk clock & focus timer
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="user-name-input"
              className="block text-xs font-medium text-neutral-300 uppercase tracking-wider mb-2"
            >
              What should we call you?
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-neutral-500">
                <User className="w-4 h-4" />
              </div>
              <input
                id="user-name-input"
                type="text"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (error) setError('');
                }}
                placeholder="Enter your name (e.g. Alex, Niketh)"
                autoFocus
                maxLength={30}
                className="w-full pl-10 pr-4 py-3 bg-neutral-950 border border-neutral-700 rounded-xl text-white placeholder-neutral-500 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 text-sm transition-all"
              />
            </div>
            {error && <p className="text-xs text-rose-400 mt-1.5">{error}</p>}
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            {canDismiss && onClose && (
              <button
                id="name-cancel-btn"
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl text-neutral-400 hover:text-white hover:bg-neutral-800 text-xs font-medium transition-colors"
              >
                Cancel
              </button>
            )}
            <button
              id="name-submit-btn"
              type="submit"
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-neutral-950 font-semibold text-xs tracking-wide shadow-lg shadow-amber-500/20 active:scale-95 transition-all cursor-pointer"
            >
              <span>{currentName ? 'Save Changes' : 'Get Started'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
