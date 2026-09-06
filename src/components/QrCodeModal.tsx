import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { X, Download, Copy, Check, QrCode as QrIcon } from 'lucide-react';

interface QrCodeModalProps {
  shortUrl: string;
  title?: string;
  onClose: () => void;
}

export const QrCodeModal: React.FC<QrCodeModalProps> = ({ shortUrl, title, onClose }) => {
  const [dataUrl, setDataUrl] = useState<string>('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    QRCode.toDataURL(
      shortUrl,
      {
        width: 320,
        margin: 2,
        color: {
          dark: '#1e1b4b', // deep indigo/navy
          light: '#ffffff',
        },
      },
      (err, url) => {
        if (!err && url) {
          setDataUrl(url);
        }
      }
    );
  }, [shortUrl]);

  const handleDownload = () => {
    if (!dataUrl) return;
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = `qrcode-${shortUrl.split('/').pop() || 'link'}.png`;
    a.click();
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shortUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
      <div className="relative w-full max-w-sm bg-slate-900/90 backdrop-blur-2xl rounded-3xl p-6 shadow-2xl border border-white/10 animate-in fade-in zoom-in-95 duration-150">
        <button
          id="qr-close-button"
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center mb-5">
          <div className="w-10 h-10 mx-auto mb-3 rounded-xl bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
            <QrIcon className="w-5 h-5" />
          </div>
          <h3 className="text-lg font-extrabold text-white">
            QR Code for Link
          </h3>
          <p className="text-xs text-slate-400 truncate max-w-[240px] mx-auto mt-0.5">
            {title || shortUrl}
          </p>
        </div>

        <div className="bg-slate-900/60 border border-white/10 rounded-2xl p-4 flex items-center justify-center mb-5">
          {dataUrl ? (
            <img
              src={dataUrl}
              alt="QR Code"
              className="w-52 h-52 rounded-xl object-contain bg-white p-2 shadow-lg"
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="w-52 h-52 flex items-center justify-center text-slate-400 text-sm">
              Generating QR...
            </div>
          )}
        </div>

        <div className="flex flex-col gap-2">
          <div className="flex gap-2">
            <button
              id="qr-download-button"
              onClick={handleDownload}
              className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs shadow-lg shadow-indigo-600/30 transition-all border border-indigo-400/30"
            >
              <Download className="w-4 h-4" />
              <span>Download PNG</span>
            </button>
            <button
              id="qr-copy-button"
              onClick={handleCopyLink}
              className="inline-flex items-center justify-center gap-1.5 px-3 py-2.5 bg-white/10 hover:bg-white/20 text-slate-200 font-medium rounded-xl text-xs transition-colors border border-white/10"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </button>
          </div>
          <div className="text-center">
            <span className="font-mono text-xs text-indigo-400 font-semibold break-all">
              {shortUrl}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};