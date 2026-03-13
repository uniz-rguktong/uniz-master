'use client';
import { createPortal } from 'react-dom';
import { useEffect, useState, useRef } from 'react';
import type { ChangeEvent } from 'react';
import { X, Upload, Loader2 } from 'lucide-react';
import Image from 'next/image';
import { uploadFileToR2 } from '@/lib/upload';
import { useToast } from '@/hooks/useToast';

type CategoryVisibility = 'public' | 'private' | 'branch';

interface CategoryData {
  name: string;
  description?: string;
  visibility?: CategoryVisibility;
  displayOrder?: number;
  coverImage?: string | null;
}

interface CategoryModalProps {
  category?: CategoryData | null;
  onClose: () => void;
  onSave: (payload: {
    name: string;
    description: string;
    visibility: CategoryVisibility;
    displayOrder: number;
    coverImage: string | null;
  }) => void;
}

export function CategoryModal({ category, onClose, onSave }: CategoryModalProps) {
  const [name, setName] = useState(category?.name || '');
  const [description, setDescription] = useState(category?.description || '');
  const [visibility, setVisibility] = useState(category?.visibility || 'public');
  const [displayOrder, setDisplayOrder] = useState(category?.displayOrder || 1);
  const [coverImage, setCoverImage] = useState(category?.coverImage || null);
  const [isUploading, setIsUploading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const { showToast } = useToast();

  useEffect(() => {
    setMounted(true);
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  useEffect(() => {
    setName(category?.name || '');
    setDescription(category?.description || '');
    setVisibility(category?.visibility || 'public');
    setDisplayOrder(category?.displayOrder || 1);
    setCoverImage(category?.coverImage || null);
  }, [category]);

  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (!file) return;

    // Basic validation
    if (!file.type.startsWith('image/')) {
      showToast("Please select a valid image file", "error");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      showToast("Image size must be less than 5MB", "error");
      return;
    }

    setIsUploading(true);
    try {
      const url = await uploadFileToR2(file);
      if (url) {
        setCoverImage(url);
        showToast("Cover image uploaded successfully", "success");
      } else {
        showToast("Failed to upload image. Please try again.", "error");
      }
    } catch (error) {
      console.error("Cover upload error:", error);
      showToast("An error occurred during upload", "error");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleSave = () => {
    if (!name.trim()) {
      showToast("Category name is required", "error");
      return;
    }
    onSave({
      name: name.trim(),
      description,
      visibility,
      displayOrder,
      coverImage
    });
  };

  if (!mounted) return null;

  return createPortal(
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-[9999] p-4 md:p-8">
      <div className="bg-[#F4F2F0] rounded-[24px] p-[10px] max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl animate-in fade-in zoom-in duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-[16px] pt-[12px] pb-[16px]">
          <h2 className="text-[18px] font-bold text-[#1A1A1A]">
            {category ? 'Edit Category' : 'Create New Category'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-[#E5E7EB] rounded-full transition-colors text-[#6B7280]">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* White Inner Card */}
        <div className="bg-white rounded-[20px] p-4 md:p-6 space-y-6 shadow-inner">
          {/* Category Name */}
          <div>
            <label className="block text-sm font-bold text-[#1A1A1A] mb-2">
              Category Name <span className="text-[#EF4444]">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={50}
              placeholder="e.g., Annual Sports Meet 2026"
              className="w-full px-4 py-3 bg-white border border-[#E5E7EB] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#10B981]/20 transition-all" />

            <div className="flex items-center justify-between mt-2">
              <span className="text-[11px] text-[#6B7280] font-medium">Choose a descriptive and catchy name</span>
              <span className="text-[11px] text-[#6B7280] font-bold">{name.length}/50</span>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-bold text-[#1A1A1A] mb-2">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={200}
              rows={3}
              placeholder="What events are included in this category?"
              className="w-full px-4 py-3 bg-white border border-[#E5E7EB] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#10B981]/20 resize-none transition-all" />

            <div className="flex items-center justify-between mt-2">
              <span className="text-[11px] text-[#6B7280] font-medium">Optional context for users</span>
              <span className="text-[11px] text-[#6B7280] font-bold">{description.length}/200</span>
            </div>
          </div>

          {/* Cover Image */}
          <div>
            <label className="block text-sm font-bold text-[#1A1A1A] mb-2">
              Cover Image
            </label>

            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              accept="image/*"
              onChange={handleFileChange}
            />

            {coverImage ?
              <div className="relative group rounded-2xl overflow-hidden border border-[#E5E7EB]">
                <Image
                  src={coverImage}
                  alt="Cover"
                  width={800}
                  height={450}
                  unoptimized
                  className="w-full aspect-video object-cover" />

                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="p-3 bg-white text-[#1A1A1A] rounded-xl font-bold text-xs hover:bg-[#F3F4F6] transition-all">
                    Change Image
                  </button>
                  <button
                    onClick={() => setCoverImage(null)}
                    className="p-3 bg-[#EF4444] text-white rounded-xl font-bold text-xs hover:bg-[#DC2626] transition-all">
                    Remove
                  </button>
                </div>
              </div> :

              <div
                onClick={() => !isUploading && fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-2xl p-8 text-center transition-all cursor-pointer ${isUploading ? 'bg-[#F7F8FA] border-[#E5E7EB]' : 'bg-white border-[#E5E7EB] hover:border-[#10B981] hover:bg-[#10B981]/5'}`}>

                <div className="flex flex-col items-center">
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-4 shadow-sm border border-[#E5E7EB] ${isUploading ? 'bg-white' : 'bg-[#F7F8FA]'}`}>
                    {isUploading ? <Loader2 className="w-7 h-7 text-[#10B981] animate-spin" /> : <Upload className="w-7 h-7 text-[#6B7280]" />}
                  </div>
                  <h3 className="text-sm font-bold text-[#1A1A1A] mb-1">
                    {isUploading ? 'Uploading Image...' : 'Select Cover Image'}
                  </h3>
                  <p className="text-[11px] text-[#6B7280] mb-4">
                    Recommended: 16:9 ratio • JPG, PNG • Max 5MB
                  </p>
                  <button
                    disabled={isUploading}
                    className="px-6 py-2 bg-[#1A1A1A] text-white rounded-xl text-xs font-bold hover:bg-[#2D2D2D] transition-all disabled:opacity-50">
                    Browse Files
                  </button>
                </div>
              </div>
            }
          </div>

          {/* Visibility Controls */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              { id: 'public', label: 'Public', desc: 'Site visible' },
              { id: 'private', label: 'Private', desc: 'Admin only' },
              { id: 'branch', label: 'Branch', desc: 'Branch only' }
            ].map((v: any) => (
              <label key={v.id} className={`flex flex-col p-4 border-2 rounded-xl cursor-pointer transition-all ${visibility === v.id ? 'border-[#10B981] bg-[#10B981]/5' : 'border-[#E5E7EB] hover:border-[#D1D5DB]'}`}>
                <input
                  type="radio"
                  name="visibility"
                  value={v.id}
                  checked={visibility === v.id}
                  onChange={(e) => setVisibility(e.target.value as CategoryVisibility)}
                  className="hidden" />
                <span className="text-xs font-bold text-[#1A1A1A]">{v.label}</span>
                <span className="text-[10px] text-[#6B7280]">{v.desc}</span>
              </label>
            ))}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-6 border-t border-[#E5E7EB]">
            <button
              onClick={onClose}
              className="px-6 py-3 bg-[#F7F8FA] border border-[#E5E7EB] rounded-xl text-sm font-bold text-[#1A1A1A] hover:bg-[#F3F4F6] transition-all">
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={isUploading}
              className="px-10 py-3 bg-[#1A1A1A] text-white rounded-xl text-sm font-black hover:bg-[#2D2D2D] shadow-xl transition-all disabled:opacity-50 flex items-center gap-2">
              {isUploading && <Loader2 className="w-4 h-4 animate-spin" />}
              {category ? 'Update Category' : 'Create Category'}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}