import React, { useState } from 'react';
import { RefreshCw, Check, AlertCircle } from 'lucide-react';

const DataSync = () => {
    const [syncing, setSyncing] = useState(false);
    const [status, setStatus] = useState(null); // 'success' | 'error' | null
    const [message, setMessage] = useState('');

    const handleSync = async () => {
        try {
            setSyncing(true);
            setStatus(null);
            setMessage('');

            const response = await fetch('/api/import', {
                method: 'POST',
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.details || 'Import failed');
            }

            setStatus('success');
            setMessage('Data synced successfully! Refreshing...');

            // Reload page after a short delay to show the success message
            setTimeout(() => {
                window.location.reload();
            }, 1500);

        } catch (error) {
            console.error('Sync error:', error);
            setStatus('error');
            setMessage(error.message);
        } finally {
            setSyncing(false);
        }
    };

    return (
        <div className="flex items-center gap-2">
            {status === 'error' && (
                <span className="text-magenta text-sm flex items-center gap-1">
                    <AlertCircle size={14} />
                    {message}
                </span>
            )}

            {status === 'success' && (
                <span className="text-mint text-sm flex items-center gap-1">
                    <Check size={14} />
                    Synced!
                </span>
            )}

            <button
                onClick={handleSync}
                disabled={syncing}
                className={`
          flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all
          ${syncing
                        ? 'bg-graphite text-smoke cursor-not-allowed'
                        : 'bg-mint/10 text-mint hover:bg-mint/20 border border-mint/30'
                    }
        `}
                title="Import data from CSV files"
            >
                <RefreshCw size={16} className={syncing ? 'animate-spin' : ''} />
                {syncing ? 'Syncing...' : 'Sync Data'}
            </button>
        </div>
    );
};

export default DataSync;
