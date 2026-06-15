import React, { useRef, useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Camera, RefreshCw, X, Check, SwitchCamera } from 'lucide-react';
import { format } from 'date-fns';
import th from 'date-fns/locale/th';

interface CameraViewProps {
    challengeText: string;
    onCapture: (file: File) => void;
    onClose: () => void;
}

const CameraView: React.FC<CameraViewProps> = ({ challengeText, onCapture, onClose }) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [stream, setStream] = useState<MediaStream | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [error, setError] = useState<string>('');
    const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');

    // Start Camera Function
    const startCamera = useCallback(async () => {
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
        }

        try {
            const mediaStream = await navigator.mediaDevices.getUserMedia({ 
                video: { 
                    facingMode: facingMode,
                    width: { ideal: 1920 }, 
                    height: { ideal: 1080 } 
                } 
            });
            setStream(mediaStream);
            if (videoRef.current) {
                videoRef.current.srcObject = mediaStream;
            }
            setError('');
        } catch (err) {
            console.error("Camera Error:", err);
            setError('ไม่สามารถเปิดกล้องได้ กรุณาอนุญาตการเข้าถึง');
        }
    }, [facingMode]);

    // Handle initial mount, facingMode changes, and retake (imagePreview resets to null)
    useEffect(() => {
        if (!imagePreview) {
            startCamera();
        }
        
        return () => {
            if (stream) {
                stream.getTracks().forEach(track => track.stop());
            }
        };
    }, [facingMode, imagePreview]);

    const toggleCamera = () => {
        setFacingMode(prev => prev === 'user' ? 'environment' : 'user');
    };

    const takePhoto = () => {
        if (videoRef.current && canvasRef.current) {
            const video = videoRef.current;
            const canvas = canvasRef.current;
            const context = canvas.getContext('2d');
            
            if (context && video.videoWidth > 0) {
                // 1. Prepare Dimensions (Internal Resolution)
                const w = video.videoWidth;
                const h = video.videoHeight;
                canvas.width = w;
                canvas.height = h;
                
                // 2. Clear & Draw Video Frame
                context.clearRect(0, 0, w, h);
                
                // Horizontal flip for selfie
                if (facingMode === 'user') {
                    context.translate(w, 0);
                    context.scale(-1, 1);
                }
                
                context.drawImage(video, 0, 0, w, h);
                
                // --- SAFE-ZONE WATERMARK MATRIX START ---
                // Reset transform to draw text normally
                context.setTransform(1, 0, 0, 1, 0, 0);

                const minDim = Math.min(w, h);
                const isLandscape = w > h;
                
                // Dynamic Sizing based on scale
                // Increase safe area to 8% to prevent edge-cropping on various screens
                const safePaddingW = Math.floor(w * 0.08); 
                const safePaddingH = Math.floor(h * 0.08);
                const baseFontSize = Math.max(24, Math.floor(minDim * 0.05));
                
                // 1. CHALLENGE PILL OVERLAY
                if (challengeText) {
                    context.font = `bold ${baseFontSize}px sans-serif`;
                    const textMetrics = context.measureText(challengeText);
                    
                    const pillPadding = baseFontSize * 0.8;
                    const pillWidth = textMetrics.width + (pillPadding * 2);
                    const pillHeight = baseFontSize * 2;
                    
                    // X center, Y depends on orientation safe zone
                    const pillX = (w - pillWidth) / 2;
                    const pillY = safePaddingH; 

                    // Draw Glow/Shadow for visibility
                    context.shadowColor = 'rgba(0, 0, 0, 0.4)';
                    context.shadowBlur = 20;
                    context.shadowOffsetY = 5;

                    // Draw Background Pill
                    context.fillStyle = "rgba(79, 70, 229, 0.95)"; // Indigo
                    if (context.roundRect) {
                        context.beginPath();
                        context.roundRect(pillX, pillY, pillWidth, pillHeight, pillHeight / 2);
                        context.fill();
                    } else {
                        context.fillRect(pillX, pillY, pillWidth, pillHeight);
                    }
                    
                    // Reset shadow for text
                    context.shadowBlur = 0;
                    context.shadowOffsetY = 0;

                    // Draw Subtext Label
                    context.fillStyle = "rgba(255, 255, 255, 0.6)";
                    context.font = `bold ${baseFontSize * 0.4}px sans-serif`;
                    context.textAlign = "center";
                    context.fillText("CHALLENGE POSE", w / 2, pillY + (baseFontSize * 0.55));

                    // Draw Challenge Text
                    context.fillStyle = "white";
                    context.font = `bold ${baseFontSize}px sans-serif`;
                    context.textAlign = "center";
                    context.textBaseline = "middle";
                    context.fillText(challengeText, w / 2, pillY + (pillHeight * 0.65));
                }

                // 2. DYNAMIC TIMESTAMP BAR (Full Width Anchor)
                const now = new Date();
                const dateStr = format(now, 'dd MMM yyyy HH:mm:ss', { locale: th });
                const metaFontSize = Math.max(16, Math.floor(minDim * 0.035));
                const barHeight = metaFontSize * 4;

                // Dark Gradient Bottom Bar for reliable contrast
                const gradient = context.createLinearGradient(0, h - barHeight, 0, h);
                gradient.addColorStop(0, "rgba(0, 0, 0, 0)");
                gradient.addColorStop(1, "rgba(0, 0, 0, 0.7)");
                context.fillStyle = gradient;
                context.fillRect(0, h - barHeight, w, barHeight);

                // Draw App Name
                context.font = `bold ${metaFontSize * 0.7}px sans-serif`;
                context.fillStyle = "#fbbf24"; // Amber
                context.textAlign = "right";
                context.fillText("Verified by Juijui V7", w - safePaddingW, h - (metaFontSize * 2));
                
                // Draw Full Timestamp
                context.font = `bold ${metaFontSize}px monospace`;
                context.fillStyle = "white";
                context.textAlign = "right";
                context.fillText(dateStr, w - safePaddingW, h - (metaFontSize * 0.8));
                // --- WATERMARK LOGIC END ---
                
                const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
                setImagePreview(dataUrl);
            }
        }
    };

    const confirmPhoto = async () => {
        if (imagePreview) {
            const res = await fetch(imagePreview);
            const blob = await res.blob();
            const file = new File([blob], `attendance-${Date.now()}.jpg`, { type: "image/jpeg" });
            onCapture(file);
        }
    };

    const retake = () => {
        setImagePreview(null);
    };

    return createPortal(
        <div className="fixed inset-0 z-[100] bg-black flex flex-col h-[100dvh]">
            <div className="absolute top-0 w-full p-4 flex justify-between items-center z-20 bg-gradient-to-b from-black/80 to-transparent pt-safe-area">
                <span className="text-white font-bold text-sm drop-shadow-md">📷 Check-in Camera</span>
                <button onClick={onClose} className="p-2 bg-white/20 backdrop-blur-md rounded-full text-white hover:bg-white/30 transition-colors">
                    <X className="w-6 h-6" />
                </button>
            </div>

            <div className="flex-1 relative flex items-center justify-center bg-gray-900 overflow-hidden">
                {error ? (
                    <div className="text-white text-center p-6 max-w-xs">
                        <p className="mb-4 font-bold">{error}</p>
                        <button onClick={onClose} className="bg-white text-black px-6 py-2 rounded-full font-bold">ปิด</button>
                    </div>
                ) : (
                    <>
                        {!imagePreview ? (
                            <video 
                                ref={videoRef} 
                                autoPlay 
                                playsInline 
                                muted 
                                className={`w-full h-full object-cover ${facingMode === 'user' ? 'transform scale-x-[-1]' : ''}`}
                            />
                        ) : (
                            <div className="w-full h-full bg-black flex items-center justify-center">
                                {/* Changed to object-contain to ensure full image with watermarks is visible */}
                                <img src={imagePreview} className="w-full h-full object-contain animate-in fade-in zoom-in-95 duration-300" />
                            </div>
                        )}
                        
                        {/* Interactive HUD Guide (UI Only) */}
                        {!imagePreview && (
                            <div className="absolute top-24 left-0 w-full flex justify-center z-10 px-4 pointer-events-none">
                                <div className="bg-indigo-600/80 backdrop-blur-md px-6 py-3 rounded-2xl border border-white/20 shadow-2xl text-center">
                                    <p className="text-[10px] text-indigo-200 font-bold uppercase tracking-widest mb-1">Challenge Pose</p>
                                    <h2 className="text-xl font-black text-white drop-shadow-md">
                                        "{challengeText}"
                                    </h2>
                                </div>
                            </div>
                        )}

                        <canvas ref={canvasRef} className="hidden" />
                    </>
                )}
            </div>

            {/* Bottom Controls Bar */}
            <div className="bg-black/90 backdrop-blur-md pb-safe-area shrink-0 border-t border-white/5">
                <div className="p-8 flex justify-between items-center gap-4 max-w-md mx-auto">
                    {!imagePreview ? (
                        <>
                            <div className="w-12 h-12"></div> 

                            <button 
                                onClick={takePhoto}
                                className="w-20 h-20 rounded-full border-[6px] border-white flex items-center justify-center bg-white/20 active:scale-95 transition-all shadow-[0_0_25px_rgba(255,255,255,0.3)] hover:bg-white/30"
                            >
                                <div className="w-16 h-16 bg-white rounded-full"></div>
                            </button>

                            <button 
                                onClick={toggleCamera}
                                className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-colors border border-white/10"
                            >
                                <SwitchCamera className="w-6 h-6" />
                            </button>
                        </>
                    ) : (
                        <div className="flex w-full justify-around items-center">
                            <button onClick={retake} className="flex flex-col items-center text-gray-400 gap-2 group">
                                <div className="p-4 rounded-full bg-gray-800 border border-gray-700 group-hover:border-gray-500 transition-colors shadow-lg"><RefreshCw className="w-6 h-6" /></div>
                                <span className="text-xs font-bold uppercase tracking-widest">ถ่ายใหม่</span>
                            </button>
                            <button onClick={confirmPhoto} className="flex flex-col items-center text-green-400 gap-2 group">
                                <div className="p-4 rounded-full bg-white text-green-600 shadow-[0_0_30px_rgba(34,197,94,0.4)] group-hover:scale-110 transition-transform"><Check className="w-8 h-8 stroke-[4px]" /></div>
                                <span className="text-xs font-bold text-white uppercase tracking-widest">ตกลง</span>
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>,
        document.body
    );
};

export default CameraView;