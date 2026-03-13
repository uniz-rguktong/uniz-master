'use client';
import { useState, useRef } from 'react';
import type { ChangeEvent } from 'react';
import { Upload, X, Image as ImageIcon, File, Plus } from 'lucide-react';
import Image from 'next/image';
import { useToast } from '@/hooks/useToast';

interface EventDocument {
  name: string;
  size: number;
  type: string;
  url: string;
}

interface MediaAssetsData {
  poster?: string | null;
  documents?: EventDocument[];
}

interface MediaAssetsStepProps {
  data: MediaAssetsData;
  updateData: (changes: Partial<MediaAssetsData>) => void;
}

export function MediaAssetsStep({ data, updateData }: MediaAssetsStepProps) {
  const [poster, setPoster] = useState(data.poster || null);
  const [documents, setDocuments] = useState<EventDocument[]>(data.documents || []);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const docInputRef = useRef<HTMLInputElement | null>(null);
  const { showToast } = useToast();

  const handleDocChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      showToast('File size too large (max 5MB)', 'error');
      return;
    }

    const newDoc = {
      name: file.name,
      size: file.size,
      type: file.type,
      url: URL.createObjectURL(file) // Mock URL
    };

    const newDocs = [...documents, newDoc];
    setDocuments(newDocs);
    updateData({ documents: newDocs });
    showToast('Document added successfully', 'success');

    // Reset input
    e.target.value = '';
  };

  const removeDocument = (index: number) => {
    const newDocs = documents.filter((_, i) => i !== index);
    setDocuments(newDocs);
    updateData({ documents: newDocs });
  };

  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      showToast('File size too large (max 5MB)', 'error');
      return;
    }

    setIsUploading(true);
    try {
      // Upload via server-side multipart proxy (validates size, type, & magic bytes)
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Upload failed');
      }

      const { publicUrl } = await response.json();

      // Update State with Public URL
      setPoster(publicUrl);
      updateData({ poster: publicUrl });
      showToast('Poster uploaded successfully', 'success');

    } catch (error) {
      console.error(error);
      const message = error instanceof Error ? error.message : 'Unknown error';
      showToast('Upload failed: ' + message, 'error');
    } finally {
      setIsUploading(false);
    }
  };

  const removePoster = () => {
    setPoster(null);
    updateData({ poster: null });
  };

  return (
    <div className="space-y-8">
      {/* Event Poster */}
      <div>
        <label className="block text-sm font-medium text-[#1A1A1A] mb-2">
          Event Poster <span className="text-[#EF4444]">*</span>
        </label>

        {/* Hidden Input */}
        <input
          type="file"
          ref={fileInputRef}
          className="hidden"
          accept="image/png, image/jpeg, image/webp"
          onChange={handleFileChange}
        />

        {!poster ? (
          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-[#E5E7EB] rounded-xl p-8 text-center hover:border-[#1A1A1A] transition-colors cursor-pointer"
          >
            <div className="flex flex-col items-center">
              <div className="w-16 h-16 bg-[#F7F8FA] rounded-full flex items-center justify-center mb-4">
                <Upload className="w-8 h-8 text-[#6B7280]" />
              </div>
              <h3 className="text-sm font-medium text-[#1A1A1A] mb-1">
                {isUploading ? 'Uploading...' : 'Drag and drop or click to browse'}
              </h3>
              <p className="text-xs text-[#6B7280] mb-4">
                Recommended: 1920x1080 px (16:9 ratio) • JPG, PNG, WebP • Max 5MB
              </p>
              <button
                type="button"
                className="px-4 py-2 bg-[#1A1A1A] text-white rounded-lg text-sm font-medium hover:bg-[#2D2D2D] transition-colors"
                disabled={isUploading}
              >
                {isUploading ? 'Processing...' : 'Browse Files'}
              </button>
            </div>
          </div>
        ) : (
          <div className="mt-4 p-4 border border-[#E5E7EB] rounded-lg">
            <div className="flex items-center gap-4">
              <Image
                src={poster}
                alt="Event Poster"
                width={128}
                height={80}
                className="w-32 h-20 object-cover rounded"
              />

              <div className="flex-1">
                <div className="font-medium text-[#1A1A1A]">Event Poster</div>
                <div className="text-xs text-[#6B7280]">Uploaded Image</div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="px-3 py-1.5 bg-[#F7F8FA] hover:bg-[#F3F4F6] border border-[#E5E7EB] rounded-lg text-xs font-medium text-[#1A1A1A] transition-colors"
                >
                  Change
                </button>
                <button
                  onClick={removePoster}
                  className="p-1.5 hover:bg-[#FEE2E2] rounded transition-colors"
                >
                  <X className="w-4 h-4 text-[#EF4444]" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* URL Fallback */}
        <div className="mt-4">
          <div className="text-xs text-gray-500 mb-1">Or paste a direct image link (Temporary fix until Cloudinary is set up):</div>
          <input
            type="text"
            placeholder="https://example.com/image.jpg"
            value={poster?.startsWith('http') ? poster : ''}
            onChange={(e) => {
              setPoster(e.target.value);
              updateData({ poster: e.target.value });
            }}
            className="w-full px-3 py-2 border border-[#E5E7EB] rounded-lg text-sm"
          />
        </div>
      </div>

      {/* Document Upload */}
      <div>
        <input
          type="file"
          ref={docInputRef}
          className="hidden"
          accept=".pdf,.doc,.docx"
          onChange={handleDocChange}
        />
        <label className="block text-sm font-medium text-[#1A1A1A] mb-2">
          Event Documents <span className="text-[#6B7280]">(Optional)</span>
        </label>

        <div className="border border-[#E5E7EB] rounded-lg p-4 bg-white">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h4 className="text-sm font-medium text-[#1A1A1A]">Upload Documents</h4>
              <p className="text-xs text-[#6B7280]">Attach rulebooks, schedules, or guidelines (PDF, DOCX)</p>
            </div>
            <button
              type="button"
              className="px-3 py-1.5 bg-[#F7F8FA] hover:bg-[#F3F4F6] border border-[#E5E7EB] rounded-lg text-xs font-medium text-[#1A1A1A] transition-colors flex items-center gap-2"
              onClick={() => docInputRef.current?.click()}
            >
              <File className="w-3 h-3" />
              Add Document
            </button>
          </div>

          {documents.length === 0 ? (
            <div className="text-center py-6 border border-dashed border-[#E5E7EB] rounded-lg">
              <p className="text-xs text-[#6B7280]">No documents uploaded yet.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {documents.map((doc: any, idx: any) => (
                <div key={idx} className="flex items-center justify-between p-3 border border-[#E5E7EB] rounded-lg bg-[#F9FAFB]">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-white border border-[#E5E7EB] flex items-center justify-center">
                      <File className="w-4 h-4 text-[#6B7280]" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-[#1A1A1A]">{doc.name}</p>
                      <p className="text-xs text-[#6B7280]">{(doc.size / 1024).toFixed(1)} KB</p>
                    </div>
                  </div>
                  <button
                    onClick={() => removeDocument(idx)}
                    className="p-1.5 hover:bg-[#FEE2E2] rounded text-[#EF4444] transition-colors">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

    </div>
  );
}