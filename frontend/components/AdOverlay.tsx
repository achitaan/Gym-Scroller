/**
 * Ad Overlay Component
 * Full-screen ad display that blocks all interactions
 */

'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Ad } from '@/lib/ad-types';

interface AdOverlayProps {
    ad: Ad;
    onAdClick?: () => void;
}

export function AdOverlay({ ad, onAdClick }: AdOverlayProps) {
    const [timeRemaining, setTimeRemaining] = useState<number | null>(null);

    useEffect(() => {
        if (!ad.duration) return;

        setTimeRemaining(Math.ceil(ad.duration / 1000));

        const interval = setInterval(() => {
            setTimeRemaining((prev) => {
                if (prev === null || prev <= 1) {
                    clearInterval(interval);
                    return null;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(interval);
    }, [ad.duration]);

    const handleClick = () => {
        if (ad.clickUrl && onAdClick) {
            onAdClick();
        }
    };

    return (
        <div
            className="fixed inset-0 z-[9999] bg-black"
            style={{ touchAction: 'none' }}
        >
            {/* Ad Content */}
            <div className="relative w-full h-full">
                {ad.type === 'video' && (
                    <VideoAd content={ad.content} onClick={handleClick} />
                )}

                {ad.type === 'image' && (
                    <ImageAd
                        content={ad.content}
                        title={ad.title}
                        ctaText={ad.ctaText}
                        onClick={handleClick}
                    />
                )}

                {ad.type === 'html' && (
                    <HtmlAd content={ad.content} onClick={handleClick} />
                )}

                {/* Countdown Timer */}
                {timeRemaining !== null && timeRemaining > 0 && (
                    <div className="absolute top-4 right-4 bg-black/70 text-white px-4 py-2 rounded-full text-sm font-medium">
                        {timeRemaining}s
                    </div>
                )}

                {/* Ad Label */}
                <div className="absolute top-4 left-4 bg-yellow-500 text-black px-3 py-1 rounded text-xs font-bold uppercase">
                    Ad
                </div>
            </div>
        </div>
    );
}

function VideoAd({ content, onClick }: { content: string; onClick: () => void }) {
    const iframeRef = useRef<HTMLIFrameElement | null>(null);
    const audioUnlocked = useMemo(() => {
        try { return localStorage.getItem('audioUnlocked') === 'true'; } catch { return false; }
    }, []);
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    // Ensure autoplay works by adding required query params (muted + inline)
    const withParam = (url: string, key: string, value: string) => {
        const has = new RegExp(`[?&]${key}=`).test(url);
        if (has) return url;
        const sep = url.includes('?') ? '&' : '?';
        return `${url}${sep}${key}=${value}`;
    };

    let autoplaySrc = content;
    autoplaySrc = withParam(autoplaySrc, 'autoplay', '1');
    autoplaySrc = withParam(autoplaySrc, 'mute', audioUnlocked ? '0' : '1');
    autoplaySrc = withParam(autoplaySrc, 'playsinline', '1');
    autoplaySrc = withParam(autoplaySrc, 'enablejsapi', '1');
    autoplaySrc = withParam(autoplaySrc, 'origin', encodeURIComponent(origin));

    useEffect(() => {
        if (!audioUnlocked) return;
        const send = (func: string, args: any[] = []) => {
            const win = iframeRef.current?.contentWindow;
            if (!win) return;
            win.postMessage(JSON.stringify({ event: 'command', func, args }), '*');
        };
        const timeouts = [300, 1000, 2000];
        const ids = timeouts.map((t) => setTimeout(() => {
            send('unMute');
            send('setVolume', [100]);
            send('playVideo');
        }, t));
        return () => { ids.forEach((id) => clearTimeout(id)); };
    }, [audioUnlocked, content]);

    return (
        <div className="w-full h-full" onClick={onClick}>
            <iframe
                ref={iframeRef}
                src={autoplaySrc}
                className="w-full h-full border-0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
            />
        </div>
    );
}

function ImageAd({
    content,
    title,
    ctaText,
    onClick,
}: {
    content: string;
    title?: string;
    ctaText?: string;
    onClick: () => void;
}) {
    return (
        <div
            className="relative w-full h-full flex items-center justify-center cursor-pointer"
            onClick={onClick}
        >
            {/* Background Image */}
            <img
                src={content}
                alt={title || 'Advertisement'}
                className="absolute inset-0 w-full h-full object-cover"
            />

            {/* Overlay Content */}
            {(title || ctaText) && (
                <div className="relative z-10 text-center space-y-4">
                    {title && (
                        <h2 className="text-4xl md:text-6xl font-bold text-white drop-shadow-2xl">
                            {title}
                        </h2>
                    )}
                    {ctaText && (
                        <button className="bg-white text-black px-8 py-4 rounded-full text-xl font-bold hover:bg-gray-100 transition-colors shadow-2xl">
                            {ctaText}
                        </button>
                    )}
                </div>
            )}

            {/* Dark Overlay for better text visibility */}
            {(title || ctaText) && (
                <div className="absolute inset-0 bg-black/40" />
            )}
        </div>
    );
}

function HtmlAd({ content, onClick }: { content: string; onClick: () => void }) {
    return (
        <div
            className="w-full h-full cursor-pointer"
            onClick={onClick}
            dangerouslySetInnerHTML={{ __html: content }}
        />
    );
}
