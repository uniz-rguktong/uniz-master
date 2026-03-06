'use client';
import { useEffect, useState } from 'react';
import { Info } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../ui/select";




interface TeamSize {
  min: number | string;
  max: number | string;
}

interface BasicDetailsData {
  eventName?: string;
  title?: string;
  category?: string;
  subCategory?: string;
  eventType?: string;
  hasPrizes?: boolean;
  teamSize?: Partial<TeamSize>;
  shortDescription?: string;
  detailedDescription?: string;
  description?: string;
}

interface BasicDetailsStepProps {
  data: BasicDetailsData;
  updateData: (changes: Partial<BasicDetailsData>) => void;
}

export function BasicDetailsStep({ data, updateData }: BasicDetailsStepProps) {
  const [eventName, setEventName] = useState(data.eventName || data.title || '');
  const [category, setCategory] = useState(data.category || '');
  const [subCategory, setSubCategory] = useState(data.subCategory || '');
  const [eventType, setEventType] = useState(data.eventType || 'individual');
  const [teamSize, setTeamSize] = useState(() => {
    const ts = data.teamSize || {};
    return {
      min: (ts.min === undefined || ts.min === null || isNaN(Number(ts.min))) ? '' : Number(ts.min),
      max: (ts.max === undefined || ts.max === null || isNaN(Number(ts.max))) ? '' : Number(ts.max)
    };
  });
  const [shortDescription, setShortDescription] = useState(data.shortDescription || '');
  const [detailedDescription, setDetailedDescription] = useState(data.detailedDescription || data.description || '');
  const maxSizeValue = Number(teamSize.max || 0);
  const minSizeValue = Number(teamSize.min || 0);
  const isTeamSizeLessThanOne = eventType.includes('team') && maxSizeValue < 1;
  const isTeamSizeLessThanMin = eventType.includes('team') && maxSizeValue >= 1 && maxSizeValue < minSizeValue;

  useEffect(() => {
    setEventName(data.eventName || data.title || '');
    setCategory(data.category || '');
    setSubCategory(data.subCategory || '');
    setShortDescription(data.shortDescription || '');
    setDetailedDescription(data.detailedDescription || data.description || '');

    const nextEventType = data.eventType || 'individual';
    setEventType(nextEventType);

    const ts = data.teamSize || {};
    setTeamSize({
      min: (ts.min === undefined || ts.min === null || isNaN(Number(ts.min))) ? '' : Number(ts.min),
      max: (ts.max === undefined || ts.max === null || isNaN(Number(ts.max))) ? '' : Number(ts.max)
    });
  }, [
    data.eventName,
    data.title,
    data.category,
    data.subCategory,
    data.shortDescription,
    data.detailedDescription,
    data.description,
    data.eventType,
    data.teamSize
  ]);

  const categories = [
    'Technical Events',
    'Technical Fun Games',
    'Hackathons',
    'Quizzes',
    'Workshops',
    'Project Expo',
    'Fun Games',
    'Pre-events',
    'Sports',
    'Cultural'
  ];

  const subCategories: Record<string, string[]> = {
    'Technical Events': ['Coding', 'Robotics', 'AI/ML', 'IoT', 'Web Development', 'Mobile Apps', 'Cyber Security'],
    'Technical Fun Games': ['Technical Quiz', 'Debugging', 'Tech Charades', 'Fast Typing', 'PC Assembly'],
    'Hackathons': ['Software', 'Hardware', 'Design', 'Open Innovation'],
    'Quizzes': ['General', 'Technical', 'Business', 'Sports', 'Entertainment'],
    'Workshops': ['Web Development', 'App Development', 'Cloud Computing', 'Data Science', 'Graphic Design', 'Soft Skills'],
    'Project Expo': ['Software Projects', 'Hardware Prototypes', 'Idea Presentation'],
    'Fun Games': ['Treasure Hunt', 'Gaming', 'E-Sports', 'Photography', 'Surprise Events'],
    'Pre-events': ['Promotion', 'Online Contest', 'Flash Mob', 'Talk Show'],
    'Sports': ['Cricket', 'Volleyball', 'Badminton', 'Chess', 'Athletics'],
    'Cultural': ['Dance', 'Singing', 'Drama', 'Fashion Show', 'Art']
  };

  return (
    <div className="space-y-8">
      {/* Event Name */}
      <div>
        <label className="block text-sm font-medium text-[#1A1A1A] mb-2">
          Event Name <span className="text-[#EF4444]">*</span>
        </label>
        <input
          type="text"
          value={eventName}
          onChange={(e) => {
            setEventName(e.target.value);
            updateData({ eventName: e.target.value });
          }}
          maxLength={100}
          placeholder="Enter a clear, descriptive name"
          className="w-full px-4 py-3 bg-white border border-[#E5E7EB] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1A1A1A] focus:border-transparent" />

        <div className="flex items-center justify-between mt-2">
          <span className="text-xs text-[#6B7280]">Choose a clear, descriptive name</span>
          <span className="text-xs text-[#6B7280]">{eventName.length}/100</span>
        </div>
      </div>

      {/* Category and Sub-Category */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-[#1A1A1A] mb-2">
            Category <span className="text-[#EF4444]">*</span>
          </label>
          <Select
            value={category}
            onValueChange={(value) => {
              setCategory(value);
              setSubCategory('');
              updateData({ category: value, subCategory: '' });
            }}>
            <SelectTrigger className="w-full h-11.5 bg-white border border-[#E5E7EB] rounded-lg text-sm focus:ring-2 focus:ring-[#1A1A1A]">
              <SelectValue placeholder="Select a category" />
            </SelectTrigger>
            <SelectContent>
              {categories.map((cat: any) => (
                <SelectItem key={cat} value={cat}>{cat}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className="block text-sm font-medium text-[#1A1A1A] mb-2">
            Sub-Category <span className="text-[#6B7280]">(optional)</span>
          </label>
          <Select
            value={subCategory}
            onValueChange={(value) => {
              setSubCategory(value);
              updateData({ subCategory: value });
            }}
            disabled={!category || !subCategories[category]}>
            <SelectTrigger
              className="w-full h-11.5 bg-white border border-[#E5E7EB] rounded-lg text-sm focus:ring-2 focus:ring-[#1A1A1A] disabled:bg-[#F7F8FA] disabled:cursor-not-allowed">
              <SelectValue placeholder="Select a sub-category" />
            </SelectTrigger>
            <SelectContent>
              {category && subCategories[category]?.map((subCat: any) => (
                <SelectItem key={subCat} value={subCat}>{subCat}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Participation & Tournament Style */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Participation Type */}
        <div>
          <label className="block text-sm font-medium text-[#1A1A1A] mb-3">
            Participation Type <span className="text-[#EF4444]">*</span>
          </label>
          <div className="space-y-3">
            <label className="flex items-center gap-3 p-4 border border-[#E5E7EB] rounded-lg cursor-pointer hover:bg-[#F7F8FA] transition-colors">
              <input
                type="radio"
                name="participationType"
                checked={!eventType.includes('team')}
                onChange={() => {
                  const currentType = eventType || 'individual';
                  const isCompetition = currentType.includes('competition') || data.hasPrizes;
                  const newType = isCompetition ? 'competition' : 'individual';
                  setEventType(newType);
                  updateData({ eventType: newType });
                }}
                className="w-4 h-4 text-[#1A1A1A]" />
              <div>
                <div className="font-medium text-[#1A1A1A]">Individual</div>
                <div className="text-xs text-[#6B7280]">Participants compete alone</div>
              </div>
            </label>

            <label className="flex items-center gap-3 p-4 border border-[#E5E7EB] rounded-lg cursor-pointer hover:bg-[#F7F8FA] transition-colors">
              <input
                type="radio"
                name="participationType"
                checked={eventType.includes('team')}
                onChange={() => {
                  const currentType = eventType || 'individual';
                  const isCompetition = currentType.includes('competition') || data.hasPrizes;
                  const newType = isCompetition ? 'team_competition' : 'team';
                  setEventType(newType);
                  updateData({ eventType: newType });
                }}
                className="w-4 h-4 text-[#1A1A1A]" />
              <div>
                <div className="font-medium text-[#1A1A1A]">Team Based</div>
                <div className="text-xs text-[#6B7280]">Participants compete in groups</div>
              </div>
            </label>

            {data.eventType?.includes('team') && (
              <div className="pl-7 grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-[#6B7280] mb-2">Min Size</label>
                  <input
                    type="number"
                    min="1"
                    value={teamSize.min || ''}
                    onChange={(e) => {
                      const rawValue = e.target.value;
                      const normalized = Number(rawValue.replace(/\D/g, '')) || 0;
                      const newSize = {
                        ...teamSize,
                        min: normalized
                      };
                      setTeamSize(newSize);
                      updateData({ teamSize: newSize });
                    }}
                    onKeyDown={(e) => {
                      if (['e', 'E', '+', '-'].includes(e.key)) {
                        e.preventDefault();
                      }
                    }}
                    className="w-full px-3 py-2 border rounded-lg text-sm [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#6B7280] mb-2">Max Size</label>
                  <input
                    type="number"
                    min="1"
                    value={teamSize.max || ''}
                    onChange={(e) => {
                      const rawValue = e.target.value;
                      const normalized = Number(rawValue.replace(/\D/g, '')) || 0;
                      const newSize = {
                        ...teamSize,
                        max: normalized
                      };
                      setTeamSize(newSize);
                      updateData({ teamSize: newSize });
                    }}
                    onKeyDown={(e) => {
                      if (['e', 'E', '+', '-'].includes(e.key)) {
                        e.preventDefault();
                      }
                    }}
                    className="w-full px-3 py-2 border rounded-lg text-sm [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" />
                  {isTeamSizeLessThanOne && (
                    <p className="mt-2 text-[11px] font-medium text-[#DC2626]">
                      Maximum size should not be less than 1.
                    </p>
                  )}
                  {isTeamSizeLessThanMin && (
                    <p className="mt-2 text-[11px] font-medium text-[#DC2626]">
                      Maximum size should not be less than minimum size.
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Tournament Style */}
        <div>
          <label className="block text-sm font-medium text-[#1A1A1A] mb-3">
            Tournament Style <span className="text-[#EF4444]">*</span>
          </label>
          <div className="space-y-3">
            <label className="flex items-center gap-3 p-4 border border-[#E5E7EB] rounded-lg cursor-pointer hover:bg-[#F7F8FA] transition-colors">
              <input
                type="radio"
                name="tournamentStyle"
                checked={data.hasPrizes === true || Boolean(data.eventType?.includes('competition'))}
                onChange={() => {
                  const currentType = data.eventType || 'individual';
                  const isTeam = currentType.includes('team');
                  updateData({
                    hasPrizes: true,
                    eventType: isTeam ? 'team_competition' : 'competition'
                  });
                }}
                className="w-4 h-4 text-[#1A1A1A]" />
              <div>
                <div className="font-medium text-[#1A1A1A]">Competitive (With Prizes)</div>
                <div className="text-xs text-[#6B7280]">Event includes winner ranking and prizes</div>
              </div>
            </label>

            <label className="flex items-center gap-3 p-4 border border-[#E5E7EB] rounded-lg cursor-pointer hover:bg-[#F7F8FA] transition-colors">
              <input
                type="radio"
                name="tournamentStyle"
                checked={data.hasPrizes === false && !Boolean(data.eventType?.includes('competition'))}
                onChange={() => {
                  const currentType = data.eventType || 'individual';
                  const isTeam = currentType.includes('team');
                  updateData({
                    hasPrizes: false,
                    eventType: isTeam ? 'team' : 'workshop'
                  });
                }}
                className="w-4 h-4 text-[#1A1A1A]" />
              <div>
                <div className="font-medium text-[#1A1A1A]">Non-Competitive</div>
                <div className="text-xs text-[#6B7280]">Workshop, Seminar, or Learning session</div>
              </div>
            </label>
          </div>
        </div>
      </div>

      {/* Short Description */}
      <div>
        <label className="block text-sm font-medium text-[#1A1A1A] mb-2">
          Short Description <span className="text-[#EF4444]">*</span>
        </label>
        <textarea
          value={shortDescription}
          onChange={(e) => {
            setShortDescription(e.target.value);
            updateData({ shortDescription: e.target.value });
          }}
          maxLength={200}
          rows={3}
          placeholder="A brief summary that will appear on event cards"
          className="w-full px-4 py-3 bg-white border border-[#E5E7EB] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1A1A1A] focus:border-transparent resize-none" />

        <div className="flex items-center justify-between mt-2">
          <span className="text-xs text-[#6B7280]">This will appear on event cards</span>
          <span className="text-xs text-[#6B7280]">{shortDescription.length}/200</span>
        </div>
      </div>

      {/* Detailed Description */}
      <div>
        <label className="block text-sm font-medium text-[#1A1A1A] mb-2">
          Detailed Description
        </label>
        <textarea
          value={detailedDescription}
          onChange={(e) => {
            setDetailedDescription(e.target.value);
            updateData({ detailedDescription: e.target.value });
          }}
          rows={6}
          placeholder="Full event description with all details, agenda, and what participants can expect..."
          className="w-full px-4 py-3 bg-white border border-[#E5E7EB] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1A1A1A] focus:border-transparent resize-none" />

        <div className="flex items-center gap-2 mt-2">
          <Info className="w-4 h-4 text-[#6B7280]" />
          <span className="text-xs text-[#6B7280]">This will be visible on the event detail page</span>
        </div>
      </div>
    </div>);

}