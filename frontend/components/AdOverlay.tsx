/**
 * Ad Overlay Component
 * Full-screen ad display that blocks all interactions
 */

'use client';

import { useEffect, useState } from 'react';
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
    return (
        <div className="w-full h-full" onClick={onClick}>
            <iframe
                src={content}
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
