// Example: Using Sensor Data in a React Component

import { useSocket } from '@/lib/socket-context';
import { useEffect, useState } from 'react';

export function RepPhaseIndicator() {
    const { sensorState, connected } = useSocket();
    const [repCount, setRepCount] = useState(0);

    useEffect(() => {
        // Count completed reps (transition from eccentric back to concentric)
        if (sensorState === 'concentric') {
            setRepCount(prev => prev + 1);
        }
    }, [sensorState]);

    const getPhaseColor = () => {
        switch (sensorState) {
            case 'concentric': return 'bg-green-500';
            case 'eccentric': return 'bg-blue-500';
            case 'failure': return 'bg-red-500 animate-pulse';
            case 'waiting': return 'bg-gray-300';
            default: return 'bg-gray-200';
        }
    };

    const getPhaseText = () => {
        switch (sensorState) {
            case 'concentric': return '⬆️ LIFTING';
            case 'eccentric': return '⬇️ LOWERING';
            case 'failure': return '⚠️ FAILURE DETECTED';
            case 'waiting': return '⏸️ WAITING';
            default: return 'NOT CONNECTED';
        }
    };

    return (
        <div className="flex flex-col items-center gap-4 p-6">
            {/* Connection Status */}
            <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${connected ? 'bg-green-500' : 'bg-red-500'}`} />
                <span className="text-sm font-medium">
                    {connected ? 'Connected' : 'Disconnected'}
                </span>
            </div>

            {/* Current Phase Indicator */}
            <div className={`${getPhaseColor()} text-white px-8 py-4 rounded-lg font-bold text-xl transition-all duration-300`}>
                {getPhaseText()}
            </div>

            {/* Rep Counter */}
            <div className="text-4xl font-bold">
                {repCount} <span className="text-lg text-gray-500">reps</span>
            </div>

            {/* Failure Warning */}
            {sensorState === 'failure' && (
                <div className="bg-red-100 border-2 border-red-500 text-red-700 px-4 py-2 rounded-lg">
                    💪 Push through or rack the weight!
                </div>
            )}
        </div>
    );
}

// Example: Listening to Raw Sensor Events
export function SensorDataLogger() {
    const { subscribeToSensorData } = useSocket();
    const [events, setEvents] = useState<Array<{ time: string, state: string }>>([]);

    useEffect(() => {
        const unsubscribe = subscribeToSensorData((state) => {
            const timestamp = new Date().toLocaleTimeString();
            console.log(`[${timestamp}] Sensor state: ${state}`);

            setEvents(prev => [
                { time: timestamp, state },
                ...prev.slice(0, 9) // Keep last 10 events
            ]);
        });

        return unsubscribe;
    }, [subscribeToSensorData]);

    return (
        <div className="p-4 bg-gray-50 rounded-lg">
            <h3 className="font-bold mb-2">Sensor Event Log</h3>
            <div className="space-y-1 font-mono text-sm">
                {events.map((event, i) => (
                    <div key={i} className="flex gap-2">
                        <span className="text-gray-500">{event.time}</span>
                        <span className={`font-bold ${event.state === 'failure' ? 'text-red-600' :
                                event.state === 'concentric' ? 'text-green-600' :
                                    event.state === 'eccentric' ? 'text-blue-600' :
                                        'text-gray-600'
                            }`}>
                            {event.state.toUpperCase()}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
}
