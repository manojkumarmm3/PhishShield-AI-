import React, { useRef, useState } from 'react';
import { InputTabType } from '../types';
import { SAMPLE_PRESETS } from '../data/samples';
import { FileText, Link as LinkIcon, Upload, Mail, Sparkles, X, FileCheck, Eye } from 'lucide-react';

interface InputTabsProps {
  activeTab: InputTabType;
  setActiveTab: (tab: InputTabType) => void;
  textContent: string;
  setTextContent: (text: string) => void;
  urlContent: string;
  setUrlContent: (url: string) => void;
  headerContent: string;
  setHeaderContent: (header: string) => void;
  uploadedFile: { name: string; size: number; mimeType: string; base64Data?: string; previewUrl?: string } | null;
  setUploadedFile: (file: { name: string; size: number; mimeType: string; base64Data?: string; previewUrl?: string } | null) => void;
  onApplyPreset: (presetId: string) => void;
}

export const InputTabs: React.FC<InputTabsProps> = ({
  activeTab,
  setActiveTab,
  textContent,
  setTextContent,
  urlContent,
  setUrlContent,
  headerContent,
  setHeaderContent,
  uploadedFile,
  setUploadedFile,
  onApplyPreset,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [fileError, setFileError] = useState<string | null>(null);

  const tabs: Array<{ id: InputTabType; label: string; icon: React.ReactNode }> = [
    { id: 'text', label: 'Offer Letter Text', icon: <FileText className="w-4 h-4" /> },
    { id: 'url', label: 'URL Scanner', icon: <LinkIcon className="w-4 h-4" /> },
    { id: 'file', label: 'OCR / File Upload', icon: <Upload className="w-4 h-4" /> },
    { id: 'header', label: 'Email Header Inspector', icon: <Mail className="w-4 h-4" /> },
  ];

  const handleFileProcess = (file: File) => {
    setFileError(null);
    const validMimes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'application/pdf', 'text/plain'];
    const maxSize = 20 * 1024 * 1024; // 20 MB

    if (file.size > maxSize) {
      setFileError('File size exceeds 20MB limit.');
      return;
    }

    const reader = new FileReader();

    if (file.type.startsWith('image/')) {
      reader.onload = (e) => {
        const result = e.target?.result as string;
        const base64Data = result.split(',')[1];
        setUploadedFile({
          name: file.name,
          size: file.size,
          mimeType: file.type,
          base64Data,
          previewUrl: result,
        });
      };
      reader.readAsDataURL(file);
    } else if (file.type === 'application/pdf') {
      reader.onload = (e) => {
        const result = e.target?.result as string;
        const base64Data = result.split(',')[1];
        setUploadedFile({
          name: file.name,
          size: file.size,
          mimeType: 'application/pdf',
          base64Data,
        });
      };
      reader.readAsDataURL(file);
    } else {
      // Text or generic file
      reader.onload = (e) => {
        const text = e.target?.result as string;
        setUploadedFile({
          name: file.name,
          size: file.size,
          mimeType: file.type || 'text/plain',
        });
        setTextContent(text);
      };
      reader.readAsText(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileProcess(e.dataTransfer.files[0]);
    }
  };

  return (
    <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl overflow-hidden shadow-xl">
      {/* Tab Navigation Header */}
      <div className="flex items-center justify-between border-b border-slate-800 bg-slate-950/70 px-4 pt-2 overflow-x-auto">
        <div className="flex space-x-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center space-x-2 px-4 py-3 rounded-t-xl text-xs font-semibold tracking-wide transition-all border-b-2 ${
                activeTab === tab.id
                  ? 'border-cyan-400 text-cyan-300 bg-slate-900/90 shadow-sm'
                  : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/40'
              }`}
            >
              {tab.icon}
              <span className="whitespace-nowrap">{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Quick Sample Selector Dropdown/Pills */}
        <div className="hidden lg:flex items-center space-x-2 py-2">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center">
            <Sparkles className="w-3 h-3 text-cyan-400 mr-1" />
            Quick Presets:
          </span>
          <div className="flex items-center space-x-1.5">
            {SAMPLE_PRESETS.slice(0, 3).map((sample) => (
              <button
                key={sample.id}
                onClick={() => onApplyPreset(sample.id)}
                className="text-[11px] px-2.5 py-1 rounded-md bg-slate-800/70 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/60 transition-colors whitespace-nowrap"
                title={sample.description}
              >
                {sample.badge}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Tab Body Contents */}
      <div className="p-5">
        {/* Tab 1: Text Inspector */}
        {activeTab === 'text' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                Offer Letter or Document Text Body
              </label>
              <div className="flex items-center space-x-3 text-xs text-slate-400">
                <span className="font-mono">{textContent.length} chars</span>
                {textContent && (
                  <button
                    onClick={() => setTextContent('')}
                    className="text-slate-400 hover:text-rose-400 transition-colors flex items-center space-x-1"
                  >
                    <X className="w-3.5 h-3.5" />
                    <span>Clear</span>
                  </button>
                )}
              </div>
            </div>

            <div className="relative">
              <textarea
                value={textContent}
                onChange={(e) => setTextContent(e.target.value)}
                placeholder="Paste the job offer letter, rental agreement, or recruiter message here... (e.g. including salary, equipment policy, recruiter signature, and contact email)"
                rows={9}
                className="w-full bg-[#070A10] border border-slate-800 rounded-xl p-4 text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-cyan-500/60 focus:ring-1 focus:ring-cyan-500/30 transition-all font-sans leading-relaxed resize-y"
              />
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
              <p className="text-xs text-slate-400">
                Tip: Include details such as payment channels, equipment purchasing instructions, and company addresses for optimal detection.
              </p>
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => onApplyPreset('sample-fake-check-job')}
                  className="text-xs text-cyan-400 hover:text-cyan-300 underline font-medium"
                >
                  Load Fake Check Sample
                </button>
                <span className="text-slate-600">•</span>
                <button
                  type="button"
                  onClick={() => onApplyPreset('sample-legit-offer')}
                  className="text-xs text-emerald-400 hover:text-emerald-300 underline font-medium"
                >
                  Load Legit Offer Sample
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: URL Scanner */}
        {activeTab === 'url' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                Recruiter Website or Job Posting URL
              </label>
              {urlContent && (
                <button
                  onClick={() => setUrlContent('')}
                  className="text-xs text-slate-400 hover:text-rose-400 transition-colors flex items-center space-x-1"
                >
                  <X className="w-3.5 h-3.5" />
                  <span>Clear</span>
                </button>
              )}
            </div>

            <div className="relative flex items-center">
              <div className="absolute left-3.5 text-slate-500">
                <LinkIcon className="w-5 h-5 text-cyan-400/80" />
              </div>
              <input
                type="text"
                value={urlContent}
                onChange={(e) => setUrlContent(e.target.value)}
                placeholder="https://company-recruiting-portal.com/job/apply?token=xyz"
                className="w-full bg-[#070A10] border border-slate-800 rounded-xl pl-11 pr-4 py-3.5 text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-cyan-500/60 focus:ring-1 focus:ring-cyan-500/30 transition-all font-mono"
              />
            </div>

            <div className="bg-slate-950/40 border border-slate-800/60 rounded-xl p-4 text-xs text-slate-400 space-y-2">
              <div className="font-semibold text-slate-300">Domain & URL Heuristic Scope:</div>
              <ul className="list-disc pl-4 space-y-1 text-slate-400">
                <li>Typosquatting detection (e.g. substituting 'o' with '0' or inserting hyphens like <code className="font-mono text-cyan-400">google-careers-desk.work</code>).</li>
                <li>High-risk Top-Level Domains (TLDs) frequently abused in credential harvesting (.work, .xyz, .top, .buzz).</li>
                <li>Masked redirection vectors, shortened links (bit.ly, t.co), and non-standard port listeners.</li>
              </ul>
            </div>

            <div className="flex items-center space-x-2 pt-1">
              <span className="text-xs text-slate-400">Test Preset:</span>
              <button
                type="button"
                onClick={() => onApplyPreset('sample-suspicious-url')}
                className="text-xs text-cyan-400 hover:text-cyan-300 underline font-medium font-mono"
              >
                Load Microso0ft Typosquatted URL Sample
              </button>
            </div>
          </div>
        )}

        {/* Tab 3: OCR / File Upload */}
        {activeTab === 'file' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                Multimodal Document Inspection (Images, PDF, Text)
              </label>
              {uploadedFile && (
                <button
                  onClick={() => setUploadedFile(null)}
                  className="text-xs text-slate-400 hover:text-rose-400 transition-colors flex items-center space-x-1"
                >
                  <X className="w-3.5 h-3.5" />
                  <span>Remove File</span>
                </button>
              )}
            </div>

            {/* Hidden Input */}
            <input
              ref={fileInputRef}
              type="file"
              accept=".png,.jpg,.jpeg,.webp,.pdf,.txt,.eml"
              className="hidden"
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  handleFileProcess(e.target.files[0]);
                }
              }}
            />

            {!uploadedFile ? (
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all ${
                  isDragging
                    ? 'border-cyan-400 bg-cyan-950/20'
                    : 'border-slate-800 hover:border-slate-700 bg-slate-950/40 hover:bg-slate-950/60'
                }`}
              >
                <div className="flex flex-col items-center justify-center space-y-3">
                  <div className="w-12 h-12 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-cyan-400">
                    <Upload className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="text-sm font-semibold text-slate-200">
                      Click to upload or drag & drop offer document
                    </span>
                    <p className="text-xs text-slate-400 mt-1">
                      Supports PDF documents, Screenshots (.PNG, .JPG, .WEBP), or RFC .EML files up to 20MB.
                    </p>
                  </div>
                  <span className="inline-block px-3 py-1 bg-slate-800/80 text-cyan-300 rounded-full text-xs font-mono border border-slate-700">
                    Multimodal OCR powered by Gemini 2.5 Flash
                  </span>
                </div>
              </div>
            ) : (
              <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  {uploadedFile.previewUrl ? (
                    <div className="w-16 h-16 rounded-lg overflow-hidden border border-slate-800 bg-black flex-shrink-0">
                      <img
                        src={uploadedFile.previewUrl}
                        alt="Uploaded document preview"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className="p-3 rounded-lg bg-cyan-950/40 border border-cyan-800/50 text-cyan-400">
                      <FileCheck className="w-6 h-6" />
                    </div>
                  )}
                  <div>
                    <div className="text-sm font-semibold text-white flex items-center space-x-2">
                      <span className="truncate max-w-xs">{uploadedFile.name}</span>
                      <span className="text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono">
                        {(uploadedFile.size / 1024).toFixed(1)} KB
                      </span>
                    </div>
                    <p className="text-xs text-emerald-400 mt-1 flex items-center">
                      <Eye className="w-3.5 h-3.5 mr-1" />
                      Ready for Gemini 2.5 Flash multimodal inspection
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="text-xs px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors"
                  >
                    Change File
                  </button>
                  <button
                    onClick={() => setUploadedFile(null)}
                    className="p-1.5 rounded-lg bg-rose-950/40 hover:bg-rose-900/60 text-rose-400 border border-rose-800/50 transition-colors"
                    title="Remove file"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {fileError && (
              <p className="text-xs text-rose-400 font-medium">{fileError}</p>
            )}
          </div>
        )}

        {/* Tab 4: Email Header Inspector */}
        {activeTab === 'header' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                Raw RFC 822 Email Headers
              </label>
              <div className="flex items-center space-x-3 text-xs text-slate-400">
                <span className="font-mono">{headerContent.length} chars</span>
                {headerContent && (
                  <button
                    onClick={() => setHeaderContent('')}
                    className="text-slate-400 hover:text-rose-400 transition-colors flex items-center space-x-1"
                  >
                    <X className="w-3.5 h-3.5" />
                    <span>Clear</span>
                  </button>
                )}
              </div>
            </div>

            <textarea
              value={headerContent}
              onChange={(e) => setHeaderContent(e.target.value)}
              placeholder="Paste raw email headers starting with Received, Return-Path, Authentication-Results, SPF, or DKIM..."
              rows={8}
              className="w-full bg-[#070A10] border border-slate-800 rounded-xl p-4 text-xs font-mono text-slate-300 placeholder:text-slate-600 focus:outline-none focus:border-cyan-500/60 focus:ring-1 focus:ring-cyan-500/30 transition-all resize-y leading-relaxed"
            />

            <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
              <span>Checks: SPF (Sender Policy Framework), DKIM signature cryptographic validity, and DMARC alignment.</span>
              <button
                type="button"
                onClick={() => onApplyPreset('sample-spoofed-email-header')}
                className="text-xs text-cyan-400 hover:text-cyan-300 underline font-medium"
              >
                Load Spoofed Header Sample
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
