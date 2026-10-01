import React, { useEffect, useRef, useState } from 'react';
import QRCode from 'qrcode';
import { X, Download } from 'lucide-react';

interface QrCodeModalProps {
  shortUrl: string;
  title?: string;
  onClose: () => void;
}

export const QrCodeModal: React.FC<QrCodeModalProps> = ({ shortUrl, title, onClose }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [dataUrl, setDataUrl] = useState<string>('');

  useEffect(() => {
    if (canvasRef.current && shortUrl) {
      QRCode.toCanvas(canvasRef.current, shortUrl, { width: 260, margin: 2, color: { dark: '#0f172a', light: '#ffffff' } }, (err) => {
        if (!err) {
          setDataUrl(canvasRef.current!.toDataURL('image/png'));
        }
      });
    }
  }, [shortUrl]);

  const handleDownload = () => {
    if (!dataUrl) return;
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = `myshort-qr-${title || 'link'}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
      <div className="w-full max-w-sm bg-slate-900 border border-white/10 rounded-3xl p-6 shadow-2xl relative text-center">
        <button onClick={onClose} className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10">
          <X className="w-4 h-4" />
        </button>
        <h3 className="text-lg font-bold text-white mb-1">QR Code</h3>
        <p className="text-xs text-slate-400 mb-4 truncate">{shortUrl}</p>
        <div className="bg-white p-4 rounded-2xl inline-block mb-4">
          <canvas ref={canvasRef} />
        </div>
        <button onClick={handleDownload} disabled={!dataUrl}
          className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-lg shadow-indigo-600/30 transition-all flex items-center justify-center gap-1.5">
          <Download className="w-3.5 h-3.5" />
          <span>Download PNG</span>
        </button>
      </div>
    </div>
  );
};
