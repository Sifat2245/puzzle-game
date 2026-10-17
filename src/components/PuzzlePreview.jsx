import React from 'react';
import { Eye, X } from 'lucide-react';
import { useGame } from '../context/GameContext.jsx';

export default function PuzzlePreview() {
  const { showPreview, previewPos, setPreviewPos, setShowPreview, activeImageSrc } = useGame();
  return (
    showPreview && (
      <div
        style={{
          top: previewPos.y,
          left: previewPos.x !== null ? previewPos.x : undefined,
          right: previewPos.x === null ? 16 : undefined,
        }}
        className="absolute w-64 sm:w-72 bg-[#2d2f2b] rounded-xl shadow-2xl border border-white/20 overflow-hidden z-20"
      >
        <div
          onMouseDown={(e) => {
            const startX = e.clientX;
            const startY = e.clientY;
            const boxRect = e.currentTarget.parentElement.getBoundingClientRect();
            const moveHandler = (mev) => {
              setPreviewPos({
                x: Math.max(8, boxRect.left + (mev.clientX - startX)),
                y: Math.max(48, boxRect.top + (mev.clientY - startY)),
              });
            };
            const upHandler = () => {
              window.removeEventListener('mousemove', moveHandler);
              window.removeEventListener('mouseup', upHandler);
            };
            window.addEventListener('mousemove', moveHandler);
            window.addEventListener('mouseup', upHandler);
          }}
          className="bg-[#222420] px-3 py-1.5 flex items-center justify-between cursor-move border-b border-white/10"
        >
          <span className="text-xs font-semibold text-gray-200 flex items-center gap-1.5">
            <Eye className="w-3.5 h-3.5 text-sky-400" />
            <span>মেলানোর জন্য আসল ছবি</span>
          </span>
          <button
            onClick={() => setShowPreview(false)}
            className="text-gray-400 hover:text-white cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="p-2 bg-[#1c1d1a]">
          <img
            src={activeImageSrc}
            alt="পাজলের আসল ছবি"
            className="w-full h-auto rounded border border-white/10 object-cover"
          />
        </div>
      </div>
    )
  );
}
