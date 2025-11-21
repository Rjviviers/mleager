import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import DataSync from './DataSync';

// Mock fetch
global.fetch = vi.fn();

describe('DataSync Component', () => {
    it('renders the sync button', () => {
        render(<DataSync />);
        expect(screen.getByText('Sync Data')).toBeDefined();
    });

    it('handles sync click and success state', async () => {
        fetch.mockResolvedValueOnce({
            ok: true,
            json: async () => ({ message: 'Success' }),
        });

        render(<DataSync />);
        const button = screen.getByText('Sync Data');

        fireEvent.click(button);

        expect(screen.getByText('Syncing...')).toBeDefined();

        await waitFor(() => {
            expect(screen.getByText('Synced!')).toBeDefined();
        });
    });

    it('handles error state', async () => {
        fetch.mockResolvedValueOnce({
            ok: false,
            json: async () => ({ details: 'Import failed' }),
        });

        render(<DataSync />);
        const button = screen.getByText('Sync Data');

        fireEvent.click(button);

        await waitFor(() => {
            expect(screen.getByText('Import failed')).toBeDefined();
        });
    });
});
