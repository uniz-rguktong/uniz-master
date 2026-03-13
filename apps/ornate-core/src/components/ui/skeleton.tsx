import React from 'react';
import { cn } from "./utils";

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  width?: string | number;
  height?: string | number;
  borderRadius?: string | number;
}

export function Skeleton({ className, width, height, borderRadius, style, ...props }: SkeletonProps) {
  return (
    <div
      className={cn("skeleton-shimmer", className)}
      style={{
        width: width,
        height: height,
        borderRadius: borderRadius,
        ...style
      }}
      {...props} />);
}

export function MetricCardSkeleton() {
  return (
    <div className="bg-[#F4F2F0] rounded-[24px] p-[8px] pb-[18px] flex flex-col gap-[10px] w-full animate-card-entrance">
      <div className="bg-white border border-[#E5E7EB] rounded-[20px] w-full px-5 py-4 md:px-6 md:py-5">
        <div className="flex items-center gap-[20px]">
          <Skeleton width={52} height={52} borderRadius={14} />
          <div className="flex-1 flex flex-col gap-[8px]">
            <Skeleton width="60%" height={14} />
            <Skeleton width="40%" height={28} />
          </div>
        </div>
      </div>
      <div className="flex justify-end px-2 h-[20px]">
        <Skeleton width={80} height={12} />
      </div>
    </div>);
}

export function TableRowSkeleton() {
  return (
    <div className="flex items-center space-x-4 py-4 px-6 border-b border-[#E6E3DE]/40">
      <Skeleton width={40} height={40} borderRadius="50%" />
      <div className="flex-1 space-y-2">
        <Skeleton width="30%" height={14} />
        <Skeleton width="20%" height={10} />
      </div>
      <Skeleton width={100} height={14} />
      <Skeleton width={80} height={14} />
      <Skeleton width={60} height={24} borderRadius={20} />
    </div>);
}

export function VideoCardSkeleton() {
  return (
    <div className="bg-[#F4F2F0] rounded-[24px] p-2">
      <div className="bg-white rounded-[18px] overflow-hidden shadow-sm border border-[#E5E7EB]">
        <Skeleton width="100%" height={240} className="rounded-none" />
        <div className="p-6">
          <div className="flex justify-between items-start mb-4">
            <div className="space-y-2 flex-1">
              <Skeleton width="80%" height={24} />
              <Skeleton width="40%" height={16} />
            </div>
          </div>
          <div className="flex items-center gap-6 mb-6">
            <Skeleton width={80} height={16} />
            <Skeleton width={80} height={16} />
          </div>
          <div className="flex items-center gap-3">
            <Skeleton className="flex-1" height={42} borderRadius={10} />
            <Skeleton width={42} height={42} borderRadius={10} />
            <Skeleton width={42} height={42} borderRadius={10} />
          </div>
        </div>
      </div>
    </div>
  );
}

export function LogoCardSkeleton() {
  return (
    <div className="bg-[#F4F2F0] rounded-[24px] p-2">
      <div className="bg-white rounded-[18px] p-6 shadow-sm border border-[#E5E7EB]">
        <div className="flex items-center justify-between mb-6">
          <Skeleton width={80} height={24} borderRadius={20} />
          <Skeleton width={80} height={20} />
        </div>
        <div className="flex flex-col items-center py-8 mb-6 bg-[#F9FAFB] rounded-xl border border-dashed border-[#E5E7EB]">
          <Skeleton width={120} height={120} />
        </div>
        <div className="mb-6">
          <Skeleton width="70%" height={20} className="mb-2" />
          <div className="flex items-center gap-2">
            <Skeleton width={60} height={12} />
            <Skeleton width={60} height={12} />
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Skeleton className="flex-1" height={42} borderRadius={10} />
          <Skeleton width={42} height={42} borderRadius={10} />
          <Skeleton width={42} height={42} borderRadius={10} />
        </div>
      </div>
    </div>
  );
}