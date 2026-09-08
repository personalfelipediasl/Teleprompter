import React from 'react';
import { CameraAspectRatio, CompositionGuide } from '../../services/camera';

interface CameraViewfinderGuidesProps {
  aspectRatio: CameraAspectRatio;
  compositionGuide: CompositionGuide;
}

export const CameraViewfinderGuides: React.FC<CameraViewfinderGuidesProps> = ({
  aspectRatio,
  compositionGuide,
}) => {
  // Compute aspect ratio mask container style
  // We use CSS aspect-ratio box centered in the viewport with darkened borders around it
  const getAspectRatioClasses = () => {
    switch (aspectRatio) {
      case '16:9':
        return 'aspect-video max-w-full max-h-full';
      case '9:16':
        return 'aspect-[9/16] max-w-full max-h-full';
      case '1:1':
        return 'aspect-square max-w-full max-h-full';
      case '4:3':
        return 'aspect-[4/3] max-w-full max-h-full';
      default:
        return 'w-full h-full';
    }
  };

  return (
    <div className="absolute inset-0 pointer-events-none z-10 flex items-center justify-center overflow-hidden">
      {/* If an aspect ratio is selected (other than 'free'), render darkened letterbox/pillarbox masks */}
      {aspectRatio !== 'free' && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div
            className={`relative ${getAspectRatioClasses()} w-full h-full shadow-[0_0_0_9999px_rgba(0,0,0,0.7)] border border-white/25 rounded-xl`}
          >
            {/* Format Tag Label */}
            <div className="absolute top-2 left-2 px-2 py-0.5 rounded bg-black/70 backdrop-blur-sm text-[10px] font-mono text-cyan-300 font-semibold border border-white/10 uppercase">
              {aspectRatio} Frame Guide
            </div>
          </div>
        </div>
      )}

      {/* Composition Guides Overlay */}
      {compositionGuide === 'rule-of-thirds' && (
        <div className="absolute inset-0 pointer-events-none opacity-25">
          <div className="w-full h-full grid grid-cols-3 grid-rows-3">
            <div className="border-r border-b border-white" />
            <div className="border-r border-b border-white" />
            <div className="border-b border-white" />
            <div className="border-r border-b border-white" />
            <div className="border-r border-b border-white" />
            <div className="border-b border-white" />
            <div className="border-r border-white" />
            <div className="border-r border-white" />
            <div />
          </div>
        </div>
      )}

      {compositionGuide === 'crosshair' && (
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
          <div className="relative w-12 h-12">
            <div className="absolute top-1/2 left-0 right-0 h-[1px] bg-cyan-400/60" />
            <div className="absolute top-0 bottom-0 left-1/2 w-[1px] bg-cyan-400/60" />
            <div className="absolute inset-2 rounded-full border border-cyan-400/40" />
          </div>
        </div>
      )}

      {compositionGuide === 'safe-margins' && (
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
          {/* Action Safe (90%) */}
          <div className="w-[90%] h-[90%] border border-dashed border-amber-400/30 rounded-lg flex items-center justify-center">
            {/* Title Safe (80%) */}
            <div className="w-[88%] h-[88%] border border-dashed border-cyan-400/30 rounded-lg relative">
              <span className="absolute top-1 left-2 text-[9px] font-mono text-cyan-400/60">
                TITLE SAFE 80%
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
