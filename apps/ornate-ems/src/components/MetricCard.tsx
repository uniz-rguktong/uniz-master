

import { TrendingUp, TrendingDown } from 'lucide-react';
import { InfoTooltip } from './InfoTooltip';

















export function MetricCard({
  title,
  value,
  icon: Icon,
  iconBgColor,
  iconColor,
  infoText,
  tooltip,
  trend,

  subtitle,
  compact = false,
  delay = 0,
  className = ""
}: {
  title: string;
  value: string | number;
  icon: any;
  iconBgColor: string;
  iconColor: string;
  infoText?: string;
  tooltip?: string;
  trend?: { value: string; isPositive: boolean; comparisonText?: string };
  subtitle?: string;
  compact?: boolean;
  delay?: number;
  className?: string;
}) {
  return (
    <div
      className={`bg-[#F4F2F0] rounded-[24px] p-[8px] pb-[18px] flex flex-col gap-[10px] animate-card-entrance hover-card-effect ${className}`}
      style={{ animationDelay: `${delay}ms` }}>

      {/* White Inner Card */}
      <div className="bg-white border border-[#E5E7EB] rounded-[20px] w-full px-5 py-4 md:px-6 md:py-5 shadow-sm">
        <div className={`flex items-center ${compact ? 'gap-3 md:gap-4' : 'gap-4 md:gap-[20px]'}`}>
          {/* Icon Container */}
          <div
            className={`${compact ? 'w-10 h-10 md:w-11 md:h-11 rounded-[12px]' : 'w-12 h-12 md:w-[52px] md:h-[52px] rounded-[14px]'} flex items-center justify-center shrink-0`}
            style={{ backgroundColor: iconBgColor }}>

            <Icon className={`${compact ? 'w-5 h-5 md:w-[22px] md:h-[22px]' : 'w-6 h-6 md:w-[26px] md:h-[26px]'}`} style={{ color: iconColor }} />
          </div>

          {/* Text Content */}
          <div className="flex-1 flex flex-col gap-[4px] min-w-0">
            <div className="flex items-center gap-2 min-w-0">
              <p className={`${compact ? 'text-[12px] md:text-[13px]' : 'text-[14px] md:text-[15px]'} font-medium text-[#6B7280] leading-none truncate`}>{title}</p>
              {(infoText || tooltip) && <span className="shrink-0"><InfoTooltip text={(infoText || tooltip) as string} /></span>}
            </div>
            <p className={`${compact ? 'text-[20px] md:text-[22px]' : 'text-[24px] md:text-[28px]'} font-bold text-[#1A1A1A] leading-tight truncate`}>{value}</p>
          </div>
        </div>
      </div>

      {/* Trend Indicator */}
      {trend &&
        <div className="flex items-center justify-end gap-[4px] px-2 h-[20px]">
          {trend.isPositive ?
            <TrendingUp className="w-[14px] h-[14px] text-[#22C55E]" strokeWidth={2} /> :

            <TrendingDown className="w-[14px] h-[14px] text-[#EF4444]" strokeWidth={2} />
          }
          <span
            className={`text-[13px] font-bold ${trend.isPositive ? 'text-[#22C55E]' : 'text-[#EF4444]'}`
            }>

            {trend.value}
          </span>
          {trend.comparisonText &&
            <span className="text-[11px] font-medium text-[#9CA3AF] ml-1">
              {trend.comparisonText}
            </span>
          }
        </div>
      }
      {/* Subtitle (alternative to trend) */}
      {subtitle && !trend &&
        <div className="flex justify-end px-2 h-[20px]">
          <span className="text-[11px] font-medium text-[#9CA3AF]">
            {subtitle}
          </span>
        </div>
      }
    </div>);

}