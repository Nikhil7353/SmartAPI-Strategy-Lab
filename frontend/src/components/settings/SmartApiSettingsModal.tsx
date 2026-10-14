import React, { useState } from 'react';
import {
  X,
  KeyRound,
  ShieldCheck,
  ExternalLink,
  AlertCircle,
  CheckCircle,
  HelpCircle,
  Lock,
} from 'lucide-react';
import { SmartApiAuthStatus } from '../../types';
import { saveAuthCredentials } from '../../api/client';

interface SmartApiSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  authStatus: SmartApiAuthStatus;
  onCredentialsUpdated: () => void;
}

export const SmartApiSettingsModal: React.FC<SmartApiSettingsModalProps> = ({
  isOpen,
  onClose,
  authStatus,
  onCredentialsUpdated,
}) => {
  const [apiKey, setApiKey] = useState('');
  const [clientCode, setClientCode] = useState('');
  const [pin, setPin] = useState('');
  const [totpSecret, setTotpSecret] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setStatusMessage(null);

    const res = await saveAuthCredentials({
      apiKey,
      clientCode,
      pin,
      totpSecret,
    });

    setSubmitting(false);
    if (res.success) {
      setStatusMessage({ type: 'success', text: res.message || 'Authenticated successfully with SmartAPI!' });
      setTimeout(() => {
        onCredentialsUpdated();
        onClose();
      }, 1200);
    } else {
      setStatusMessage({
        type: 'error',
        text: res.message || 'Failed to authenticate with Angel One SmartAPI. Check Client Code, PIN and TOTP.',
      });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
      <div className="bg-white rounded-2xl border border-border shadow-xl max-w-lg w-full overflow-hidden select-none animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-border flex items-center justify-between bg-white">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-lg bg-blue-50 border border-blue-200 text-primary">
              <KeyRound className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-text-primary">
                Angel One SmartAPI Configuration
              </h3>
              <p className="text-2xs text-text-secondary">
                Secure backend credentials &amp; session manager
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-text-secondary hover:text-text-primary hover:bg-slate-100 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-4">
          {/* Security Notice */}
          <div className="p-3 bg-slate-50 border border-border rounded-xl flex items-start space-x-2.5 text-xs text-text-secondary">
            <Lock className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <p className="text-2xs leading-relaxed">
              <strong>Backend Isolation:</strong> API Keys, PIN, and TOTP seeds are transmitted exclusively to your local Django backend and never exposed in frontend code, git commits, or browser logs.
            </p>
          </div>

          {/* Current Auth Status Pill */}
          <div className="flex items-center justify-between p-3 rounded-xl border border-slate-200 bg-slate-50 text-xs">
            <span className="text-text-secondary font-medium">Session Status:</span>
            {authStatus.connected ? (
              <span className="flex items-center space-x-1.5 text-bull font-bold font-mono">
                <CheckCircle className="w-3.5 h-3.5" />
                <span>Connected ({authStatus.clientCode})</span>
              </span>
            ) : (
              <span className="flex items-center space-x-1.5 text-warn font-semibold">
                <AlertCircle className="w-3.5 h-3.5" />
                <span>Not Connected — Dev Simulation Active</span>
              </span>
            )}
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
            <div>
              <label className="block text-text-primary font-semibold mb-1">
                SmartAPI Key
              </label>
              <input
                type="text"
                required
                placeholder="e.g. 5xXgTq..."
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-border rounded-lg text-text-primary placeholder-slate-400 font-mono text-xs focus:outline-none focus:ring-1 focus:ring-primary focus:bg-white transition"
              />
            </div>

            <div>
              <label className="block text-text-primary font-semibold mb-1">
                Client Code
              </label>
              <input
                type="text"
                required
                placeholder="e.g. A123456"
                value={clientCode}
                onChange={(e) => setClientCode(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-border rounded-lg text-text-primary placeholder-slate-400 font-mono text-xs focus:outline-none focus:ring-1 focus:ring-primary focus:bg-white transition"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-text-primary font-semibold mb-1">
                  4-Digit MPIN
                </label>
                <input
                  type="password"
                  maxLength={6}
                  required
                  placeholder="••••"
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-border rounded-lg text-text-primary placeholder-slate-400 font-mono text-xs focus:outline-none focus:ring-1 focus:ring-primary focus:bg-white transition"
                />
              </div>

              <div>
                <label className="block text-text-primary font-semibold mb-1">
                  TOTP Secret Key (Base32)
                </label>
                <input
                  type="password"
                  required
                  placeholder="Base32 Key from Angel One"
                  value={totpSecret}
                  onChange={(e) => setTotpSecret(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-border rounded-lg text-text-primary placeholder-slate-400 font-mono text-xs focus:outline-none focus:ring-1 focus:ring-primary focus:bg-white transition"
                />
              </div>
            </div>

            {statusMessage && (
              <div
                className={`p-3 rounded-lg text-xs flex items-center space-x-2 ${
                  statusMessage.type === 'success'
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                    : 'bg-red-50 text-red-800 border border-red-200'
                }`}
              >
                {statusMessage.type === 'success' ? (
                  <CheckCircle className="w-4 h-4 shrink-0 text-emerald-600" />
                ) : (
                  <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
                )}
                <span>{statusMessage.text}</span>
              </div>
            )}

            {/* Action Buttons */}
            <div className="pt-2 flex items-center justify-between">
              <a
                href="https://smartapi.angelone.in/docs"
                target="_blank"
                rel="noreferrer"
                className="text-2xs text-primary font-medium hover:underline flex items-center space-x-1"
              >
                <span>Angel One Docs</span>
                <ExternalLink className="w-3 h-3" />
              </a>

              <div className="flex space-x-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 border border-border rounded-lg text-text-secondary hover:bg-slate-50 font-semibold transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-primary hover:bg-primary-hover text-white rounded-lg font-semibold shadow-sm transition disabled:opacity-50"
                >
                  {submitting ? 'Connecting...' : 'Save & Authenticate'}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
