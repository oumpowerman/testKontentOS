import { useState, useEffect, useRef } from 'react';

export type SynthType = 'BINAURAL' | 'OCEAN_RUMBLE' | 'CHIPTUNE';

export function useAudioSynth() {
    const [isAudioSynthPlaying, setIsAudioSynthPlaying] = useState(false);
    const [synthType, setSynthType] = useState<SynthType>('BINAURAL');
    const audioCtxRef = useRef<AudioContext | null>(null);
    const synthNodesRef = useRef<any[]>([]);

    const stopAudioSynthesizer = () => {
        if (synthNodesRef.current.length > 0) {
            synthNodesRef.current.forEach(node => {
                try {
                    if (node.stop) node.stop();
                    else if (node.disconnect) node.disconnect();
                } catch (e) {}
            });
            synthNodesRef.current = [];
        }
        setIsAudioSynthPlaying(false);
    };

    const startAudioSynthesizer = () => {
        try {
            // Lazy load audio context
            if (!audioCtxRef.current) {
                audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
            }

            const ctx = audioCtxRef.current;
            if (ctx.state === 'suspended') {
                ctx.resume();
            }

            // Cleanup previous nodes first
            stopAudioSynthesizer();

            if (synthType === 'BINAURAL') {
                // Binaural beats (Left: 200Hz, Right: 210Hz) to induce calm focus 10Hz Alpha brain wave
                const oscLeft = ctx.createOscillator();
                const oscRight = ctx.createOscillator();
                const merger = ctx.createChannelMerger(2);
                const gain = ctx.createGain();

                oscLeft.frequency.value = 200; // Left ear
                oscRight.frequency.value = 210; // Right ear (10hz delta!)

                oscLeft.connect(merger, 0, 0);
                oscRight.connect(merger, 0, 1);

                gain.gain.value = 0.08; // Soothing low volume
                merger.connect(gain);
                gain.connect(ctx.destination);

                oscLeft.start();
                oscRight.start();

                synthNodesRef.current = [oscLeft, oscRight, gain];
            } else if (synthType === 'OCEAN_RUMBLE') {
                // Low-pass brownian noise modeling ocean waves
                const bufferSize = 2 * ctx.sampleRate;
                const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
                const output = noiseBuffer.getChannelData(0);
                let lastOut = 0.0;
                for (let i = 0; i < bufferSize; i++) {
                    const white = Math.random() * 2 - 1;
                    output[i] = (lastOut + (0.02 * white)) / 1.02;
                    lastOut = output[i];
                    output[i] *= 3.5; // compensation value
                }

                const noise = ctx.createBufferSource();
                noise.buffer = noiseBuffer;
                noise.loop = true;

                const filter = ctx.createBiquadFilter();
                filter.type = 'lowpass';
                filter.frequency.value = 400;

                const waveLfo = ctx.createOscillator();
                waveLfo.frequency.value = 0.12; // Ocean tidewalk wave rate (8 seconds cycle)
                const waveGain = ctx.createGain();
                waveGain.gain.value = 250; // Sweeping range

                const masterGain = ctx.createGain();
                masterGain.gain.value = 0.12;

                waveLfo.connect(waveGain);
                waveGain.connect(filter.frequency);
                noise.connect(filter);
                filter.connect(masterGain);
                masterGain.connect(ctx.destination);

                noise.start();
                waveLfo.start();

                synthNodesRef.current = [noise, waveLfo, waveGain, filter, masterGain];
            } else {
                // Low-fi cozy retro synthesized arpeggiative loop (Ambient Chiptune)
                const notes = [261.63, 311.13, 392.00, 466.16]; // Cm7 retro chord sweep
                let noteIndex = 0;
                
                const intervalId = setInterval(() => {
                    if (!audioCtxRef.current) return;
                    const c = audioCtxRef.current;
                    const osc = c.createOscillator();
                    const g = c.createGain();
                    
                    osc.type = 'triangle'; // classic soft chip note
                    osc.frequency.setValueAtTime(notes[noteIndex], c.currentTime);
                    
                    // decay envelope
                    g.gain.setValueAtTime(0.04, c.currentTime);
                    g.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + 1.2);
                    
                    osc.connect(g);
                    g.connect(c.destination);
                    osc.start();
                    osc.stop(c.currentTime + 1.3);
                    
                    noteIndex = (noteIndex + 1) % notes.length;
                }, 800);

                synthNodesRef.current = [{ stop: () => clearInterval(intervalId) }];
            }

            setIsAudioSynthPlaying(true);
        } catch (e) {
            console.error('Audio synthesizer error:', e);
        }
    };

    // Auto update sound if playing and synthType shifts
    useEffect(() => {
        if (isAudioSynthPlaying) {
            startAudioSynthesizer();
        }
    }, [synthType]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            stopAudioSynthesizer();
        };
    }, []);

    const toggleSynth = () => {
        if (isAudioSynthPlaying) {
            stopAudioSynthesizer();
        } else {
            startAudioSynthesizer();
        }
    };

    const ringSuccessChime = () => {
        try {
            const ctx = audioCtxRef.current || new (window.AudioContext || (window as any).webkitAudioContext)();
            const now = ctx.currentTime;
            const osc = ctx.createOscillator();
            const osc2 = ctx.createOscillator();
            const gain = ctx.createGain();

            osc.type = 'sine';
            osc.frequency.setValueAtTime(523.25, now); // C5
            osc.frequency.setValueAtTime(659.25, now + 0.15); // E5
            osc.frequency.setValueAtTime(783.99, now + 0.3); // G5
            osc.frequency.setValueAtTime(1046.50, now + 0.45); // C5 octave!!

            osc2.type = 'triangle';
            osc2.frequency.setValueAtTime(261.63, now); // soft lower support harmonic

            gain.gain.setValueAtTime(0.1, now);
            gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.8);

            osc.connect(gain);
            osc2.connect(gain);
            gain.connect(ctx.destination);

            osc.start();
            osc2.start();
            osc.stop(now + 1.0);
            osc2.stop(now + 1.0);
        } catch (e) {}
    };

    return {
        isAudioSynthPlaying,
        synthType,
        setSynthType,
        startAudioSynthesizer,
        stopAudioSynthesizer,
        toggleSynth,
        ringSuccessChime,
        audioCtx: audioCtxRef.current
    };
}
