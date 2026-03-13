'use client';
import { useEffect, useState } from 'react';
import { CheckCircle, AlertCircle, Smartphone, Monitor } from 'lucide-react';
import { formatTimeTo12h } from '@/lib/dateUtils';

interface ReviewPublishData {
  eventName?: string;
  title?: string;
  description?: string;
  detailedDescription?: string;
  venue?: string;
  date?: string;
  startDate?: string;
  startTime?: string;
  rules?: string;
  registrationStatus?: string;
  poster?: string;
  posterUrl?: string;
  category?: string;
  shortDescription?: string;
  maxParticipants?: string;
  maxCapacity?: string;
  coordinators?: Array<unknown>;
  publishType?: string;
  scheduledPublishDate?: string;
  scheduledPublishTime?: string;
}

interface ReviewPublishStepProps {
  data: ReviewPublishData;
  updateData: (changes: Partial<ReviewPublishData>) => void;
}

interface ChecklistItem {
  label: string;
  completed: boolean;
  warning?: boolean;
}

export function ReviewPublishStep({ data, updateData }: ReviewPublishStepProps) {
  const [previewDevice, setPreviewDevice] = useState('desktop');
  const [publishType, setPublishType] = useState(data.publishType || 'now');
  const [scheduledPublishDate, setScheduledPublishDate] = useState(data.scheduledPublishDate || '');
  const [scheduledPublishTime, setScheduledPublishTime] = useState(data.scheduledPublishTime || '');

  useEffect(() => {
    setPublishType(data.publishType || 'now');
    setScheduledPublishDate(data.scheduledPublishDate || '');
    setScheduledPublishTime(data.scheduledPublishTime || '');
  }, [data.publishType, data.scheduledPublishDate, data.scheduledPublishTime]);

  const checklistItems: ChecklistItem[] = [
    { label: 'Event name and description added', completed: !!(data.eventName || data.title && (data.description || data.detailedDescription)) },
    { label: 'Venue and timing set', completed: !!(data.venue && (data.date || data.startDate) && data.startTime) },
    { label: 'Rules and guidelines provided', completed: !!(data.rules) },
    { label: 'Registration settings configured', completed: !!(data.registrationStatus) },
    { label: 'Poster uploaded', completed: !!(data.poster || data.posterUrl) },
    { label: 'Coordinator contact visible', completed: !!(data.coordinators && data.coordinators.length > 0), warning: !(data.coordinators && data.coordinators.length > 0) }
  ];

  return (
    <div className="space-y-8">
      {/* Summary Checklist */}
      <div>
        <h3 className="text-sm font-medium text-[#1A1A1A] mb-4">Event Summary Checklist</h3>
        <div className="bg-white border border-[#E5E7EB] rounded-xl p-6">
          <div className="space-y-3">
            {checklistItems.map((item: any, index: any) =>
              <div
                key={index}
                className={`flex items-center gap-3 p-3 rounded-lg ${item.warning ? 'bg-[#FEF3C7]' : 'bg-[#F7F8FA]'}`
                }>

                {item.completed ?
                  <CheckCircle className="w-5 h-5 text-[#10B981] shrink-0" /> :

                  <AlertCircle className="w-5 h-5 text-[#F59E0B] shrink-0" />
                }
                <span className={`text-sm ${item.warning ? 'text-[#92400E]' : 'text-[#1A1A1A]'}`}>
                  {item.label}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Preview */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-medium text-[#1A1A1A]">Preview</h3>
          <div className="flex items-center gap-2 bg-[#F7F8FA] p-1 rounded-lg">
            <button
              onClick={() => setPreviewDevice('desktop')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded transition-colors ${previewDevice === 'desktop' ?
                'bg-white text-[#1A1A1A] shadow-sm' :
                'text-[#6B7280]'}`
              }>

              <Monitor className="w-4 h-4" />
              <span className="text-xs font-medium">Desktop</span>
            </button>
            <button
              onClick={() => setPreviewDevice('mobile')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded transition-colors ${previewDevice === 'mobile' ?
                'bg-white text-[#1A1A1A] shadow-sm' :
                'text-[#6B7280]'}`
              }>

              <Smartphone className="w-4 h-4" />
              <span className="text-xs font-medium">Mobile</span>
            </button>
          </div>
        </div>

        <div className="border-2 border-[#E5E7EB] rounded-xl p-6 bg-[#F7F8FA]">
          <div className={`bg-white rounded-lg overflow-hidden shadow-lg mx-auto ${previewDevice === 'mobile' ? 'max-w-sm' : ''}`
          }>
            <div className="aspect-video bg-linear-to-br from-[#3B82F6] to-[#8B5CF6] flex items-center justify-center text-white overflow-hidden relative">
              {data.poster || data.posterUrl ? (
                <img src={data.poster || data.posterUrl} alt="Poster" className="w-full h-full object-cover" />
              ) : (
                <div className="text-center p-4">
                  <div className="text-2xl font-bold mb-2">{data.eventName || data.title || 'Event Name'}</div>
                  <div className="text-sm opacity-90">Project Preview</div>
                </div>
              )}
            </div>
            <div className="p-6">
              <div className="inline-block px-3 py-1 bg-[#8B5CF6] text-white text-xs font-semibold rounded-full mb-3">
                {data.category || 'General'}
              </div>
              <h3 className="text-lg font-semibold text-[#1A1A1A] mb-2">
                {data.eventName || data.title || 'Event Name'}
              </h3>
              <p className="text-sm text-[#6B7280] mb-4 line-clamp-2">
                {data.shortDescription || data.description || 'No description provided.'}
              </p>
              <div className="space-y-2 text-sm text-[#6B7280]">
                <div className="flex items-center gap-2">
                  <span>📍</span> {data.venue || 'Venue TBD'}
                </div>
                <div className="flex items-center gap-2">
                  <span>📅</span> {data.startDate || (data.date ? new Date(data.date).toLocaleDateString() : 'Date TBD')} • {formatTimeTo12h(data.startTime) || 'Time TBD'}
                </div>
                <div className="flex items-center gap-2">
                  <span>👥</span> Capacity: {data.maxParticipants || data.maxCapacity || 'Unlimited'}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Publishing Options */}
      <div>
        <h3 className="text-sm font-medium text-[#1A1A1A] mb-4">Publishing Options</h3>

        <div className="space-y-3 mb-4">
          <label className="flex items-center gap-3 p-4 border-2 rounded-lg cursor-pointer transition-all">
            <input
              type="radio"
              name="publishType"
              value="now"
              checked={publishType === 'now'}
              onChange={(e) => {
                const value = e.target.value;
                setPublishType(value);
                updateData({ publishType: value });
              }}
              className="w-4 h-4 text-[#1A1A1A]" />

            <div>
              <div className="font-medium text-[#1A1A1A]">Publish Now</div>
              <div className="text-xs text-[#6B7280]">Make event live immediately</div>
            </div>
          </label>

          <label className="flex items-center gap-3 p-4 border-2 rounded-lg cursor-pointer transition-all">
            <input
              type="radio"
              name="publishType"
              value="scheduled"
              checked={publishType === 'scheduled'}
              onChange={(e) => {
                const value = e.target.value;
                setPublishType(value);
                updateData({ publishType: value });
              }}
              className="w-4 h-4 text-[#1A1A1A]" />

            <div className="flex-1">
              <div className="font-medium text-[#1A1A1A]">Schedule for Later</div>
              <div className="text-xs text-[#6B7280] mb-2">Choose when to publish</div>
              {publishType === 'scheduled' &&
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
                  <input
                    type="date"
                    value={scheduledPublishDate}
                    onChange={(e) => {
                      setScheduledPublishDate(e.target.value);
                      updateData({ scheduledPublishDate: e.target.value });
                    }}
                    className="w-full px-3 py-2 bg-white border border-[#E5E7EB] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1A1A1A]"
                  />
                  <input
                    type="time"
                    value={scheduledPublishTime}
                    onChange={(e) => {
                      setScheduledPublishTime(e.target.value);
                      updateData({ scheduledPublishTime: e.target.value });
                    }}
                    className="w-full px-3 py-2 bg-white border border-[#E5E7EB] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1A1A1A]"
                  />
                </div>
              }
            </div>
          </label>
        </div>
      </div>
    </div>);
}