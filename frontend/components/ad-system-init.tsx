/**
 * Ad System Initialization
 * Sets up global ad trigger functions on client side
 */

'use client';

import { useEffect } from 'react';
import { setupGlobalAdTriggers } from '@/lib/ad-event-bus';

export function AdSystemInit() {
    useEffect(() => {
        // Initialize global ad trigger functions
        setupGlobalAdTriggers();
    }, []);

    return null;
}
