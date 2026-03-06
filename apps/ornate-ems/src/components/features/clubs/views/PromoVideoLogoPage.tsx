'use client';
import { useState, useEffect } from 'react';
import { Upload, Video, Image as ImageIcon, Play, Eye, Share2, CheckCircle, Trash2, X } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { VideoCard } from '@/components/VideoCard';
import { LogoCard } from '@/components/LogoCard';
import { Modal } from '@/components/Modal';
import { MetricCard } from '@/components/MetricCard';
import { Skeleton, MetricCardSkeleton, VideoCardSkeleton, LogoCardSkeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/useToast';
import Image from 'next/image';

import {
  getPromoVideos, createPromoVideo, updatePromoVideo, deletePromoVideo,
  getBrandLogos, createBrandLogo, updateBrandLogo, deleteBrandLogo
} from '@/actions/promoActions';

export function PromoVideoLogoPage() {
  const { toast, showToast, hideToast } = useToast();
  const [activeTab, setActiveTab] = useState('videos');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    const [videosRes, logosRes] = await Promise.all([
      getPromoVideos(),
      getBrandLogos()
    ]);

    if (videosRes.success) setPromoVideos(videosRes.data || []);
    if (logosRes.success) setLogos(logosRes.data || []);
    setIsLoading(false);
  };

  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [showUploadVideoModal, setShowUploadVideoModal] = useState(false);
  const [showUploadLogoModal, setShowUploadLogoModal] = useState(false);
  const [promoVideos, setPromoVideos] = useState<any[]>([]);
  const [logos, setLogos] = useState<any[]>([]);

  // States for Select components
  const [videoUploadMethod, setVideoUploadMethod] = useState('Video URL (YouTube/Vimeo)');
  const [videoPlatform, setVideoPlatform] = useState('YouTube');
  const [videoStatus, setVideoStatus] = useState('Active');

  const [logoType, setLogoType] = useState('Primary Logo');
  const [logoFormat, setLogoFormat] = useState('SVG');
  const [logoStatus, setLogoStatus] = useState('Active');

  const [selectedVideo, setSelectedVideo] = useState<any>(null);
  const [showVideoPreviewModal, setShowVideoPreviewModal] = useState(false);

  // Form states for modals
  const [videoTitle, setVideoTitle] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [logoName, setLogoName] = useState('');
  const [logoPreview, setLogoPreview] = useState<any>(null);

  // Preview state
  const [selectedLogo, setSelectedLogo] = useState<any | null>(null);
  const [showLogoPreviewModal, setShowLogoPreviewModal] = useState(false);

  // Edit States
  const [editingVideo, setEditingVideo] = useState<any>(null);
  const [showEditVideoModal, setShowEditVideoModal] = useState(false);
  const [editingLogo, setEditingLogo] = useState<any>(null);
  const [showEditLogoModal, setShowEditLogoModal] = useState(false);

  // Delete States
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<any>(null);
  const [deleteType, setDeleteType] = useState('video'); // 'video' or 'logo'

  const handleFileUpload = (type: any) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = type === 'video' ? 'video/*' : 'image/*';
    input.onchange = (e: any) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        if (type === 'image') {
          // Check file size (limit to 2MB for base64 storage safety)
          if (file.size > 2 * 1024 * 1024) {
            showToast('File size too large. Please use an image under 2MB.', 'error');
            return;
          }

          const reader = new FileReader();
          reader.onloadend = () => {
            setLogoPreview(reader.result);
            showToast(`Selected file: ${file.name}`);
          };
          reader.readAsDataURL(file);
        } else {
          // Video upload simulation
          showToast('Direct video upload is disabled in this environment. Please use YouTube/Vimeo URL.', 'warning');
          setVideoUploadMethod('Video URL (YouTube/Vimeo)');
        }
      }
    };
    input.click();
  };

  const handleVideoPreview = (video: any) => {
    setSelectedVideo(video);
    setShowVideoPreviewModal(true);
  };

  const closeVideoModal = () => {
    setShowUploadVideoModal(false);
    setVideoTitle('');
    setVideoUrl('');
  };

  const closeLogoModal = () => {
    setShowUploadLogoModal(false);
    setLogoName('');
    setLogoPreview(null);
    // Note: We don't revoke the ObjectURL here because it's now being used 
    // by the newly added Logo in the dashboard grid.
  };

  const getVideoId = (video: any) => {
    if (!video || !video.url) return null;
    if (video.platform === 'YouTube') {
      const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
      const match = video.url.match(regExp);
      return (match && match[2].length === 11) ? match[2] : null;
    }
    if (video.platform === 'Vimeo') {
      return video.url.split('/').pop()?.split('?')[0];
    }
    return null;
  };

  const getEmbedUrl = (video: any) => {
    const videoId = getVideoId(video);
    if (!videoId) return null;

    if (video.platform === 'YouTube') {
      return `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0`;
    }

    if (video.platform === 'Vimeo') {
      return `https://player.vimeo.com/video/${videoId}?autoplay=1`;
    }

    return null;
  };

  const getThumbnailUrl = (video: any) => {
    const videoId = getVideoId(video);
    if (!videoId) return video.thumbnail; // Fallback to provided thumbnail

    if (video.platform === 'YouTube') {
      return `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
    }

    if (video.platform === 'Vimeo') {
      // Use vumbnail.com for easy Vimeo thumbnails without API calls
      return `https://vumbnail.com/${videoId}.jpg`;
    }

    return video.thumbnail;
  };

  const handleVideoEdit = (video: any) => {
    setEditingVideo(video);
    setVideoTitle(video.title);
    setVideoUrl(video.url || '');
    setVideoPlatform(video.platform);
    setVideoStatus(video.status.charAt(0).toUpperCase() + video.status.slice(1));
    // Determine upload method based on existing data
    setVideoUploadMethod(video.url ? 'Video URL (YouTube/Vimeo)' : 'Upload File');
    setShowEditVideoModal(true);
  };

  const handleVideoDelete = (video: any) => {
    setItemToDelete(video);
    setDeleteType('video');
    setShowDeleteModal(true);
  };

  const handleLogoDownload = (logo: any) => {
    try {
      const fileUrl = logo.url || logo.thumbnail;
      if (!fileUrl) {
        showToast('Logo file is not available', 'error');
        return;
      }

      // Clean name for downloading (remove old extension and spaces)
      const cleanName = logo.name.replace(/\.[^/.]+$/, "").replace(/\s+/g, '_');
      const downloadName = `${cleanName}.png`;
      const downloadUrl = `/api/branding/download?url=${encodeURIComponent(fileUrl)}&filename=${encodeURIComponent(downloadName)}&format=png`;

      const link = document.createElement('a');
      link.href = downloadUrl;
      link.setAttribute('download', downloadName);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      showToast(`Downloaded ${logo.name}`, 'success');
    } catch (error) {
      showToast('Failed to download logo', 'error');
    }
  };

  const handleLogoEdit = (logo: any) => {
    setEditingLogo(logo);
    setLogoName(logo.name);
    setLogoType(logo.type);
    setLogoFormat(logo.format);
    setLogoStatus(logo.status.charAt(0).toUpperCase() + logo.status.slice(1));
    setLogoPreview(logo.thumbnail); // Pre-fill with existing thumbnail
    setShowEditLogoModal(true);
  };

  const handleLogoDelete = (logo: any) => {
    setItemToDelete(logo);
    setDeleteType('logo');
    setShowDeleteModal(true);
  };

  const handleLogoPreview = (logo: any) => {
    setSelectedLogo(logo);
    setShowLogoPreviewModal(true);
  };

  const confirmDelete = async () => {
    if (!itemToDelete) return;

    let result;
    if (deleteType === 'video') {
      result = await deletePromoVideo(itemToDelete.id);
      if (result.success) {
        setPromoVideos(prev => prev.filter(v => v.id !== itemToDelete.id));
        showToast(`Deleted Video: ${itemToDelete.title}`, 'success');
      }
    } else {
      result = await deleteBrandLogo(itemToDelete.id);
      if (result.success) {
        setLogos(prev => prev.filter(l => l.id !== itemToDelete.id));
        showToast(`Deleted Logo: ${itemToDelete.name}`, 'success');
      }
    }

    if (result && !result.success) {
      showToast(result.error || 'Delete failed', 'error');
    }

    setShowDeleteModal(false);
    setItemToDelete(null);
  };

  return (
    <div className="p-8 animate-page-entrance">
      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-wrap items-center gap-2 text-sm text-[#6B7280] mb-3">
          <span className="whitespace-nowrap">Dashboard</span>
          <span className="whitespace-nowrap">›</span>
          <span className="whitespace-nowrap">Content Management</span>
          <span className="whitespace-nowrap">›</span>
          <span className="text-[#1A1A1A] font-medium whitespace-nowrap">Promo Videos & Logos</span>
        </div>

        <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
          <div>
            <h1 className="text-[28px] font-semibold text-[#1A1A1A] mb-2">Promo Videos & Logos</h1>
            <p className="text-sm text-[#6B7280]">Manage promotional content and branding assets</p>
          </div>

          <button
            onClick={() => {
              if (activeTab === 'videos') {
                setShowUploadVideoModal(true);
              } else {
                setShowUploadLogoModal(true);
              }
            }}
            className="flex items-center justify-center gap-2 px-5 py-3 bg-[#10B981] text-white rounded-lg text-sm font-medium hover:bg-[#059669] transition-colors shadow-sm w-full md:w-auto">

            <Upload className="w-5 h-5" />
            Upload {activeTab === 'videos' ? 'Video' : 'Logo'}
          </button>
        </div>

        {/* Tab Navigation - Premium Segmented Pill Design */}
        <div className="inline-flex items-center p-1 bg-[#F4F2F0] rounded-lg border border-[#E5E7EB]/50">
          <button
            onClick={() => setActiveTab('videos')}
            className={`flex items-center gap-2 px-6 py-2 text-sm font-medium rounded-[7px] transition-all duration-200 ${activeTab === 'videos' ?
              'bg-white text-[#1A1A1A] shadow-[0_1px_4px_-1px_rgba(0,0,0,0.05)]' :
              'text-[#6B7280] hover:text-[#1A1A1A]'}`}
          >
            <Video className="w-4 h-4" />
            Promo Videos
          </button>
          <button
            onClick={() => setActiveTab('logos')}
            className={`flex items-center gap-2 px-6 py-2 text-sm font-medium rounded-[7px] transition-all duration-200 ${activeTab === 'logos' ?
              'bg-white text-[#1A1A1A] shadow-[0_1px_4px_-1px_rgba(0,0,0,0.05)]' :
              'text-[#6B7280] hover:text-[#1A1A1A]'}`}
          >
            <ImageIcon className="w-4 h-4" />
            Brand Logos
          </button>
        </div>
      </div>

      {/* Promo Videos Tab */}
      {activeTab === 'videos' &&
        <div className="space-y-6">
          {/* Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {isLoading ? (
              <>
                <MetricCardSkeleton />
                <MetricCardSkeleton />
                <MetricCardSkeleton />
                <MetricCardSkeleton />
              </>
            ) : (
              <>
                <div className="animate-card-entrance" style={{ animationDelay: '40ms' }}>
                  <MetricCard
                    title="Total Videos"
                    value={promoVideos.length}
                    icon={Video}
                    iconBgColor="#EFF6FF"
                    iconColor="#3B82F6"
                    tooltip="Total promotional videos uploaded" />
                </div>

                <div className="animate-card-entrance" style={{ animationDelay: '80ms' }}>
                  <MetricCard
                    title="Total Views"
                    value={promoVideos.reduce((sum: any, v: any) => sum + v.views, 0).toLocaleString()}
                    icon={Eye}
                    iconBgColor="#F5F3FF"
                    iconColor="#8B5CF6"
                    tooltip="Cumulative views across all active videos" />
                </div>

                <div className="animate-card-entrance" style={{ animationDelay: '120ms' }}>
                  <MetricCard
                    title="Active Videos"
                    value={promoVideos.filter((v: any) => v.status === 'active').length}
                    icon={Play}
                    iconBgColor="#F0FDF4"
                    iconColor="#10B981"
                    tooltip="Videos currently visible to students" />
                </div>

                <div className="animate-card-entrance" style={{ animationDelay: '160ms' }}>
                  <MetricCard
                    title="Platforms"
                    value={new Set(promoVideos.filter(v => v.platform).map(v => v.platform)).size}
                    icon={Share2}
                    iconBgColor="#FFFBEB"
                    iconColor="#F59E0B"
                    tooltip="Social platforms where videos are hosted" />
                </div>
              </>
            )}
          </div>

          {/* Videos Grid - Using flex with fixed max-width */}
          <div className="animate-card-entrance" style={{ animationDelay: '200ms' }}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {isLoading ? (
                <>
                  <VideoCardSkeleton />
                  <VideoCardSkeleton />
                </>
              ) : (
                promoVideos.map((video: any) =>
                  <div key={video.id}>
                    <VideoCard
                      video={{ ...video, thumbnail: getThumbnailUrl(video) }}
                      onPreview={() => handleVideoPreview(video)}
                      onEdit={() => handleVideoEdit(video)}
                      onDelete={() => handleVideoDelete(video)} />
                  </div>
                )
              )}
            </div>
          </div>
        </div>
      }

      {/* Logos Tab */}
      {activeTab === 'logos' &&
        <div className="space-y-6">
          {/* Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {isLoading ? (
              <>
                <MetricCardSkeleton />
                <MetricCardSkeleton />
                <MetricCardSkeleton />
                <MetricCardSkeleton />
              </>
            ) : (
              <>
                <div className="animate-card-entrance" style={{ animationDelay: '40ms' }}>
                  <MetricCard
                    title="Total Logos"
                    value={logos.length}
                    icon={ImageIcon}
                    iconBgColor="#EFF6FF"
                    iconColor="#3B82F6"
                    tooltip="Total brand logos uploaded" />
                </div>

                <div className="animate-card-entrance" style={{ animationDelay: '80ms' }}>
                  <MetricCard
                    title="SVG Files"
                    value={logos.filter((l: any) => l.format === 'SVG').length}
                    icon={Share2}
                    iconBgColor="#F5F3FF"
                    iconColor="#8B5CF6"
                    tooltip="Vector format logos (scalable)" />
                </div>

                <div className="animate-card-entrance" style={{ animationDelay: '120ms' }}>
                  <MetricCard
                    title="Active Logos"
                    value={logos.filter((l: any) => l.status === 'active').length}
                    icon={CheckCircle}
                    iconBgColor="#F0FDF4"
                    iconColor="#10B981"
                    tooltip="Logos currently in use across the platform" />
                </div>

                <div className="animate-card-entrance" style={{ animationDelay: '160ms' }}>
                  <MetricCard
                    title="PNG Files"
                    value={logos.filter((l: any) => l.format === 'PNG').length}
                    icon={ImageIcon}
                    iconBgColor="#FFFBEB"
                    iconColor="#F59E0B"
                    tooltip="Raster format logos (static)" />
                </div>
              </>
            )}
          </div>

          {/* Logos Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {isLoading ? (
              <>
                <LogoCardSkeleton />
                <LogoCardSkeleton />
                <LogoCardSkeleton />
              </>
            ) : (
              logos.map((logo: any) =>
                <LogoCard
                  key={logo.id}
                  logo={logo}
                  onPreview={() => handleLogoPreview(logo)}
                  onDownload={() => handleLogoDownload(logo)}
                  onEdit={() => handleLogoEdit(logo)}
                  onDelete={() => handleLogoDelete(logo)} />
              )
            )}
          </div>
        </div>
      }

      {/* Upload Video Modal */}
      {showUploadVideoModal &&
        <Modal
          isOpen={true}
          onClose={closeVideoModal}
          title="Upload Promo Video"
          size="lg"
          onConfirm={async () => {
            if (!videoTitle.trim()) {
              showToast('Please enter a video title');
              return;
            }
            const data = {
              title: videoTitle,
              url: videoUrl,
              platform: videoPlatform,
              status: videoStatus.toLowerCase(),
              duration: '0:00', // Default
              thumbnail: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=600&h=400&fit=crop'
            };
            const result = await createPromoVideo(data);
            if (result.success) {
              setPromoVideos(prev => [result.data, ...prev]);
              showToast('Video uploaded successfully', 'success');
              closeVideoModal();
            } else {
              showToast(result.error || 'Error uploading video', 'error');
            }
          }}
          confirmText="Upload Video"
          confirmButtonClass="bg-[#10B981] hover:bg-[#059669]">

          <div className="space-y-5 p-8">
            <div>
              <label className="block text-sm font-medium text-[#1A1A1A] mb-2">Video Title *</label>
              <input
                type="text"
                value={videoTitle}
                onChange={(e) => setVideoTitle(e.target.value)}
                placeholder="Enter video title"
                className="w-full px-4 py-2.5 bg-white border border-[#E5E7EB] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#10B981]" />
            </div>

            <div>
              <label className="block text-sm font-medium text-[#1A1A1A] mb-2">Upload Method *</label>
              <Select value={videoUploadMethod} onValueChange={setVideoUploadMethod}>
                <SelectTrigger className="w-full px-4 py-2.5 bg-white border border-[#E5E7EB] rounded-lg text-sm text-[#1A1A1A]">
                  <SelectValue placeholder="Select method" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Upload File">Upload File</SelectItem>
                  <SelectItem value="Video URL (YouTube/Vimeo)">Video URL (YouTube/Vimeo)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium text-[#1A1A1A] mb-2">Video {videoUploadMethod === 'Upload File' ? 'File' : 'URL'} *</label>
              {videoUploadMethod === 'Upload File' ? (
                <div
                  onClick={() => handleFileUpload('video')}
                  className="border-2 border-dashed border-[#E5E7EB] rounded-lg p-8 text-center hover:border-[#10B981] transition-colors cursor-pointer bg-white">
                  <Upload className="w-12 h-12 text-[#9CA3AF] mx-auto mb-3" />
                  <p className="text-sm text-[#6B7280] mb-1">
                    <span className="text-[#10B981] font-medium">Click to upload</span> or drag and drop
                  </p>
                  <p className="text-xs text-[#9CA3AF]">MP4, MOV, AVI (max. 500MB)</p>
                </div>
              ) : (
                <input
                  type="text"
                  value={videoUrl}
                  onChange={(e) => setVideoUrl(e.target.value)}
                  placeholder="Paste YouTube or Vimeo URL"
                  className="w-full px-4 py-2.5 bg-white border border-[#E5E7EB] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#10B981]"
                />
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-[#1A1A1A] mb-2">Platform</label>
                <Select value={videoPlatform} onValueChange={setVideoPlatform}>
                  <SelectTrigger className="w-full px-4 py-2.5 bg-white border border-[#E5E7EB] rounded-lg text-sm text-[#1A1A1A]">
                    <SelectValue placeholder="Select platform" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="YouTube">YouTube</SelectItem>
                    <SelectItem value="Vimeo">Vimeo</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="block text-sm font-medium text-[#1A1A1A] mb-2">Status</label>
                <Select value={videoStatus} onValueChange={setVideoStatus}>
                  <SelectTrigger className="w-full px-4 py-2.5 bg-white border border-[#E5E7EB] rounded-lg text-sm text-[#1A1A1A]">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Active">Active</SelectItem>
                    <SelectItem value="Inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-[#1A1A1A] mb-2">Thumbnail (Optional)</label>
              <div className="border-2 border-dashed border-[#E5E7EB] rounded-lg p-6 text-center hover:border-[#10B981] transition-colors cursor-pointer">
                <ImageIcon className="w-8 h-8 text-[#9CA3AF] mx-auto mb-2" />
                <p className="text-xs text-[#6B7280]">Upload custom thumbnail (JPG, PNG)</p>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-[#1A1A1A] mb-2">Description</label>
              <textarea
                rows={3}
                placeholder="Brief description of the video..."
                className="w-full px-4 py-2.5 bg-white border border-[#E5E7EB] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#10B981] resize-none" />

            </div>
          </div>
        </Modal>
      }

      {/* Edit Video Modal */}
      {showEditVideoModal && editingVideo &&
        <Modal
          isOpen={true}
          onClose={() => setShowEditVideoModal(false)}
          title="Edit Promo Video"
          size="lg"
          onConfirm={async () => {
            const data = { title: videoTitle, url: videoUrl, platform: videoPlatform, status: videoStatus.toLowerCase() };
            const result = await updatePromoVideo(editingVideo.id, data);
            if (result.success) {
              setPromoVideos(prev => prev.map(v =>
                v.id === editingVideo.id ? result.data : v
              ));
              showToast('Video updated successfully', 'success');
              setShowEditVideoModal(false);
              setVideoTitle('');
              setVideoUrl('');
            } else {
              showToast(result.error || 'Error updating video', 'error');
            }
          }}
          confirmText="Update Video"
          confirmButtonClass="bg-[#10B981] hover:bg-[#059669]">
          <div className="space-y-5 p-8">
            <div>
              <label className="block text-sm font-medium text-[#1A1A1A] mb-2">Video Title *</label>
              <input
                type="text"
                value={videoTitle}
                onChange={(e) => setVideoTitle(e.target.value)}
                placeholder="Enter video title"
                className="w-full px-4 py-2.5 bg-white border border-[#E5E7EB] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#10B981]" />
            </div>

            <div>
              <label className="block text-sm font-medium text-[#1A1A1A] mb-2">Upload Method *</label>
              <Select value={videoUploadMethod} onValueChange={setVideoUploadMethod}>
                <SelectTrigger className="w-full px-4 py-2.5 bg-white border border-[#E5E7EB] rounded-lg text-sm text-[#1A1A1A]">
                  <SelectValue placeholder="Select method" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Upload File">Upload File</SelectItem>
                  <SelectItem value="Video URL (YouTube/Vimeo)">Video URL (YouTube/Vimeo)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium text-[#1A1A1A] mb-2">Video {videoUploadMethod === 'Upload File' ? 'File' : 'URL'} *</label>
              {videoUploadMethod === 'Upload File' ? (
                <div
                  onClick={() => handleFileUpload('video')}
                  className="border-2 border-dashed border-[#E5E7EB] rounded-lg p-8 text-center hover:border-[#10B981] transition-colors cursor-pointer bg-white">
                  <Upload className="w-12 h-12 text-[#9CA3AF] mx-auto mb-3" />
                  <p className="text-sm text-[#6B7280] mb-1">
                    <span className="text-[#10B981] font-medium">Click to upload</span> or drag and drop
                  </p>
                  <p className="text-xs text-[#9CA3AF]">MP4, MOV, AVI (max. 500MB)</p>
                </div>
              ) : (
                <input
                  type="text"
                  value={videoUrl}
                  onChange={(e) => setVideoUrl(e.target.value)}
                  placeholder="Paste YouTube or Vimeo URL"
                  className="w-full px-4 py-2.5 bg-white border border-[#E5E7EB] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#10B981]"
                />
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-[#1A1A1A] mb-2">Platform</label>
                <Select value={videoPlatform} onValueChange={setVideoPlatform}>
                  <SelectTrigger className="w-full px-4 py-2.5 bg-white border border-[#E5E7EB] rounded-lg text-sm text-[#1A1A1A]">
                    <SelectValue placeholder="Select platform" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="YouTube">YouTube</SelectItem>
                    <SelectItem value="Vimeo">Vimeo</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="block text-sm font-medium text-[#1A1A1A] mb-2">Status</label>
                <Select value={videoStatus} onValueChange={setVideoStatus}>
                  <SelectTrigger className="w-full px-4 py-2.5 bg-white border border-[#E5E7EB] rounded-lg text-sm text-[#1A1A1A]">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Active">Active</SelectItem>
                    <SelectItem value="Inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </Modal>
      }

      {/* Upload Logo Modal */}
      {showUploadLogoModal &&
        <Modal
          isOpen={true}
          onClose={closeLogoModal}
          title="Upload Logo"
          size="lg"
          onConfirm={async () => {
            if (!logoName.trim()) {
              showToast('Please enter a logo name');
              return;
            }
            const data = {
              name: logoName,
              type: logoType,
              format: logoFormat,
              status: logoStatus.toLowerCase(),
              url: logoPreview || 'https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=300&h=300&fit=crop',
              thumbnail: logoPreview || 'https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=300&h=300&fit=crop',
              size: '0 KB',
              dimensions: 'N/A'
            };
            const result = await createBrandLogo(data);
            if (result.success) {
              setLogos(prev => [result.data, ...prev]);
              showToast('Logo uploaded successfully', 'success');
              closeLogoModal();
            } else {
              showToast(result.error || 'Error uploading logo', 'error');
            }
          }}
          confirmText="Upload Logo"
          confirmButtonClass="bg-[#10B981] hover:bg-[#059669]">

          <div className="space-y-5 p-8">
            <div>
              <label className="block text-sm font-medium text-[#1A1A1A] mb-2">Logo Name *</label>
              <input
                type="text"
                value={logoName}
                onChange={(e) => setLogoName(e.target.value)}
                placeholder="Enter logo name"
                className="w-full px-4 py-2.5 bg-white border border-[#E5E7EB] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#10B981]" />
            </div>

            <div>
              <label className="block text-sm font-medium text-[#1A1A1A] mb-2">Logo Type *</label>
              <Select value={logoType} onValueChange={setLogoType}>
                <SelectTrigger className="w-full px-4 py-2.5 bg-white border border-[#E5E7EB] rounded-lg text-sm text-[#1A1A1A]">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Primary Logo">Primary Logo</SelectItem>
                  <SelectItem value="Department">Department</SelectItem>
                  <SelectItem value="University">University</SelectItem>
                  <SelectItem value="Sponsor">Sponsor</SelectItem>
                  <SelectItem value="Partner">Partner</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium text-[#1A1A1A] mb-2">Upload Logo File *</label>
              <div
                onClick={() => handleFileUpload('image')}
                className="relative border-2 border-dashed border-[#E5E7EB] rounded-2xl p-4 text-center hover:border-[#10B981] transition-all cursor-pointer bg-white min-h-[160px] flex flex-col items-center justify-center overflow-hidden group">
                {logoPreview ? (
                  <>
                    <Image
                      src={logoPreview}
                      alt="Preview"
                      width={300}
                      height={140}
                      unoptimized
                      className="max-h-[140px] max-w-full object-contain mb-2"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <p className="text-white text-sm font-medium">Change Image</p>
                    </div>
                  </>
                ) : (
                  <>
                    <ImageIcon className="w-12 h-12 text-[#9CA3AF] mb-3" />
                    <p className="text-sm text-[#6B7280] mb-1">
                      <span className="text-[#10B981] font-medium">Click to upload</span> or drag and drop
                    </p>
                    <p className="text-xs text-[#9CA3AF]">SVG, PNG, JPG (max. 5MB)</p>
                  </>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-[#1A1A1A] mb-2">Format</label>
                <Select value={logoFormat} onValueChange={setLogoFormat}>
                  <SelectTrigger className="w-full px-4 py-2.5 bg-white border border-[#E5E7EB] rounded-lg text-sm text-[#1A1A1A]">
                    <SelectValue placeholder="Select format" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="SVG">SVG</SelectItem>
                    <SelectItem value="PNG">PNG</SelectItem>
                    <SelectItem value="JPG">JPG</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="block text-sm font-medium text-[#1A1A1A] mb-2">Status</label>
                <Select value={logoStatus} onValueChange={setLogoStatus}>
                  <SelectTrigger className="w-full px-4 py-2.5 bg-white border border-[#E5E7EB] rounded-lg text-sm text-[#1A1A1A]">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Active">Active</SelectItem>
                    <SelectItem value="Inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-[#1A1A1A] mb-2">Usage Guidelines (Optional)</label>
              <textarea
                rows={3}
                placeholder="Enter usage guidelines for this logo..."
                className="w-full px-4 py-2.5 bg-white border border-[#E5E7EB] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#10B981] resize-none" />

            </div>

            <div className="bg-[#F7F8FA] border border-[#E5E7EB] rounded-lg p-4">
              <h4 className="text-sm font-medium text-[#1A1A1A] mb-2">File Requirements</h4>
              <ul className="text-xs text-[#6B7280] space-y-1">
                <li>• Minimum resolution: 800x800px</li>
                <li>• Transparent background preferred for PNG files</li>
                <li>• Vector format (SVG) recommended for scalability</li>
                <li>• Maximum file size: 5MB</li>
              </ul>
            </div>
          </div>
        </Modal>
      }

      {/* Edit Logo Modal */}
      {showEditLogoModal && editingLogo &&
        <Modal
          isOpen={true}
          onClose={() => setShowEditLogoModal(false)}
          title="Edit Logo"
          size="lg"
          onConfirm={() => {
            setLogos(prev => prev.map(l =>
              l.id === editingLogo.id
                ? { ...l, name: logoName, type: logoType, format: logoFormat, status: logoStatus.toLowerCase(), thumbnail: logoPreview }
                : l
            ));
            showToast('Logo updated successfully');
            setShowEditLogoModal(false);
            setLogoName('');
            setLogoPreview(null);
          }}
          confirmText="Update Logo"
          confirmButtonClass="bg-[#10B981] hover:bg-[#059669]">
          <div className="space-y-5 p-8">
            <div>
              <label className="block text-sm font-medium text-[#1A1A1A] mb-2">Logo Name *</label>
              <input
                type="text"
                value={logoName}
                onChange={(e) => setLogoName(e.target.value)}
                placeholder="Enter logo name"
                className="w-full px-4 py-2.5 bg-white border border-[#E5E7EB] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#10B981]" />
            </div>

            <div>
              <label className="block text-sm font-medium text-[#1A1A1A] mb-2">Update Logo File</label>
              <div
                onClick={() => handleFileUpload('image')}
                className="relative border-2 border-dashed border-[#E5E7EB] rounded-2xl p-4 text-center hover:border-[#10B981] transition-all cursor-pointer bg-white min-h-[160px] flex flex-col items-center justify-center overflow-hidden group">
                {logoPreview ? (
                  <>
                    <Image
                      src={logoPreview}
                      alt="Preview"
                      width={300}
                      height={140}
                      unoptimized
                      className="max-h-[140px] max-w-full object-contain mb-2"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <p className="text-white text-sm font-medium">Change Image</p>
                    </div>
                  </>
                ) : (
                  <>
                    <ImageIcon className="w-12 h-12 text-[#9CA3AF] mb-3" />
                    <p className="text-sm text-[#6B7280] mb-1">
                      <span className="text-[#10B981] font-medium">Click to upload</span> or drag and drop
                    </p>
                    <p className="text-xs text-[#9CA3AF]">SVG, PNG, JPG (max. 5MB)</p>
                  </>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-[#1A1A1A] mb-2">Logo Type *</label>
              <Select value={logoType} onValueChange={setLogoType}>
                <SelectTrigger className="w-full px-4 py-2.5 bg-white border border-[#E5E7EB] rounded-lg text-sm text-[#1A1A1A]">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Primary Logo">Primary Logo</SelectItem>
                  <SelectItem value="Department">Department</SelectItem>
                  <SelectItem value="University">University</SelectItem>
                  <SelectItem value="Sponsor">Sponsor</SelectItem>
                  <SelectItem value="Partner">Partner</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-[#1A1A1A] mb-2">Format</label>
                <Select value={logoFormat} onValueChange={setLogoFormat}>
                  <SelectTrigger className="w-full px-4 py-2.5 bg-white border border-[#E5E7EB] rounded-lg text-sm text-[#1A1A1A]">
                    <SelectValue placeholder="Select format" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="SVG">SVG</SelectItem>
                    <SelectItem value="PNG">PNG</SelectItem>
                    <SelectItem value="JPG">JPG</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="block text-sm font-medium text-[#1A1A1A] mb-2">Status</label>
                <Select value={logoStatus} onValueChange={setLogoStatus}>
                  <SelectTrigger className="w-full px-4 py-2.5 bg-white border border-[#E5E7EB] rounded-lg text-sm text-[#1A1A1A]">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Active">Active</SelectItem>
                    <SelectItem value="Inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </Modal>
      }
      {/* Custom Delete Confirmation Modal */}
      {showDeleteModal && itemToDelete && (
        <Modal
          isOpen={true}
          onClose={() => setShowDeleteModal(false)}
          title="Confirm Deletion"
          size="sm"
          onConfirm={confirmDelete}
          confirmText="Delete Asset"
          confirmButtonClass="bg-[#EF4444] hover:bg-[#DC2626]"
        >
          <div className="p-8 text-center">
            <div className="w-16 h-16 bg-[#FEF2F2] rounded-full flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-8 h-8 text-[#EF4444]" />
            </div>
            <h3 className="text-lg font-semibold text-[#1A1A1A] mb-2">Are you sure?</h3>
            <p className="text-sm text-[#6B7280]">
              You are about to delete <span className="font-semibold text-[#1A1A1A]">&quot;{itemToDelete.title || itemToDelete.name}&quot;</span>.
              This action cannot be undone.
            </p>
          </div>
        </Modal>
      )}

      {/* Video Preview Modal */}
      {showVideoPreviewModal && selectedVideo && (
        <Modal
          isOpen={true}
          onClose={() => setShowVideoPreviewModal(false)}
          title={`Preview: ${selectedVideo.title}`}
          size="xl"
          footer={
            <div className="flex justify-between items-center w-full">
              <div className="flex items-center gap-4 text-sm text-[#6B7280]">
                <div className="flex items-center gap-1.5">
                  <Eye className="w-4 h-4" />
                  {selectedVideo.views.toLocaleString()} views
                </div>
                <div className="flex items-center gap-1.5">
                  <Share2 className="w-4 h-4" />
                  {selectedVideo.platform}
                </div>
              </div>
              <button
                onClick={() => setShowVideoPreviewModal(false)}
                className="px-6 py-2.5 bg-[#1A1A1A] text-white rounded-xl text-sm font-semibold hover:bg-[#2D2D2D] transition-colors"
              >
                Close Preview
              </button>
            </div>
          }
        >
          <div className="p-4">
            <div className="relative aspect-video bg-black rounded-2xl overflow-hidden shadow-2xl group">
              {getEmbedUrl(selectedVideo) ? (
                <iframe
                  src={getEmbedUrl(selectedVideo) as string}
                  title={selectedVideo.title}
                  className="w-full h-full border-0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                ></iframe>
              ) : (
                <>
                  {/* Mock Video Player Interface for Direct Uploads */}
                  <Image
                    src={getThumbnailUrl(selectedVideo)}
                    alt={selectedVideo.title}
                    fill
                    unoptimized
                    className="object-cover opacity-60"
                  />

                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <div className="w-20 h-20 bg-white/10 backdrop-blur-md rounded-full border border-white/20 flex items-center justify-center cursor-pointer hover:scale-110 transition-transform duration-300 group">
                      <Play className="w-8 h-8 text-white fill-white ml-1" />
                    </div>
                    <p className="mt-4 text-white font-medium tracking-wide">Video stream will appear here</p>
                  </div>

                  {/* Controls Overlay */}
                  <div className="absolute bottom-0 left-0 right-0 p-6 bg-linear-to-t from-black/80 to-transparent">
                    <div className="h-1 w-full bg-white/20 rounded-full mb-4 cursor-pointer relative">
                      <div className="absolute top-0 left-0 h-full w-1/3 bg-[#10B981] rounded-full" />
                      <div className="absolute top-1/2 left-1/3 -translate-y-1/2 w-3 h-3 bg-white rounded-full shadow-lg" />
                    </div>
                    <div className="flex items-center justify-between text-white">
                      <div className="flex items-center gap-4">
                        <Play className="w-5 h-5 fill-current" />
                        <div className="text-sm font-mono">01:12 / {selectedVideo.duration}</div>
                      </div>
                      <div className="flex items-center gap-4 text-sm font-medium">
                        <span>1080p</span>
                        <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center font-mono text-[10px]">
                          VOL
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </Modal>
      )}
      {/* Logo Preview Modal */}
      {showLogoPreviewModal && selectedLogo && (
        <Modal
          isOpen={true}
          onClose={() => setShowLogoPreviewModal(false)}
          title={`Logo Preview - ${selectedLogo.name}`}
          size="lg"
        >
          <div className="p-8 flex items-center justify-center bg-white rounded-xl">
            <div className="relative w-full max-w-2xl aspect-square bg-[#F7F8FA] rounded-xl overflow-hidden shadow-inner flex items-center justify-center p-12">
              <Image
                src={selectedLogo.url || selectedLogo.thumbnail}
                alt={selectedLogo.name}
                className="max-w-full max-h-full object-contain drop-shadow-md"
                width={800}
                height={800}
                unoptimized
                priority
              />
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}