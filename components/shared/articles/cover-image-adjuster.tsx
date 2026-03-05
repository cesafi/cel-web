'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import Image from 'next/image';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { RotateCcw, MoveVertical, MoveHorizontal, ZoomIn } from 'lucide-react';

export interface CoverImagePosition {
  x: number; // 0-100, horizontal position percentage
  y: number; // 0-100, vertical position percentage
  scale: number; // 1-2, zoom scale
}

const DEFAULT_POSITION: CoverImagePosition = { x: 50, y: 50, scale: 1 };

interface CoverImageAdjusterProps {
  imageUrl: string;
  position: CoverImagePosition | null;
  onChange: (position: CoverImagePosition) => void;
}

export function CoverImageAdjuster({ imageUrl, position, onChange }: CoverImageAdjusterProps) {
  const pos = position || DEFAULT_POSITION;
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleChange = useCallback(
    (updates: Partial<CoverImagePosition>) => {
      onChange({ ...pos, ...updates });
    },
    [pos, onChange]
  );

  const handleReset = useCallback(() => {
    onChange(DEFAULT_POSITION);
  }, [onChange]);

  // Drag-to-position handler
  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    setIsDragging(true);
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  }, []);

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!isDragging || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const x = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100));
      const y = Math.max(0, Math.min(100, ((e.clientY - rect.top) / rect.height) * 100));
      onChange({ ...pos, x: Math.round(x), y: Math.round(y) });
    },
    [isDragging, pos, onChange]
  );

  const handlePointerUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  const isDefault = pos.x === 50 && pos.y === 50 && pos.scale === 1;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium">Adjust Cover Position</Label>
        {!isDefault && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleReset}
            className="h-7 text-xs text-muted-foreground hover:text-foreground"
          >
            <RotateCcw className="mr-1 h-3 w-3" />
            Reset
          </Button>
        )}
      </div>

      {/* Preview with drag */}
      <div
        ref={containerRef}
        className="relative h-36 w-full cursor-move overflow-hidden rounded-lg border border-border/50 bg-muted/30"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
      >
        <Image
          src={imageUrl}
          alt="Cover preview"
          fill
          className="object-cover pointer-events-none select-none"
          style={{
            objectPosition: `${pos.x}% ${pos.y}%`,
            transform: `scale(${pos.scale})`,
            transformOrigin: `${pos.x}% ${pos.y}%`,
          }}
          draggable={false}
        />
        {/* Crosshair indicator */}
        <div
          className="absolute w-5 h-5 border-2 border-white rounded-full shadow-md pointer-events-none"
          style={{
            left: `${pos.x}%`,
            top: `${pos.y}%`,
            transform: 'translate(-50%, -50%)',
            boxShadow: '0 0 0 1px rgba(0,0,0,0.3), 0 2px 4px rgba(0,0,0,0.3)',
          }}
        >
          <div className="absolute inset-1 rounded-full bg-white/80" />
        </div>
        {/* Drag hint */}
        {!isDragging && (
          <div className="absolute inset-0 flex items-end justify-center pb-2 opacity-0 hover:opacity-100 transition-opacity">
            <span className="bg-black/60 text-white text-[10px] px-2 py-0.5 rounded-full">
              Drag to reposition
            </span>
          </div>
        )}
      </div>

      {/* Vertical position slider */}
      <div className="space-y-1.5">
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <MoveVertical className="h-3 w-3" />
          <span>Vertical Position</span>
          <span className="ml-auto tabular-nums">{pos.y}%</span>
        </div>
        <Slider
          value={[pos.y]}
          onValueChange={([y]) => handleChange({ y })}
          min={0}
          max={100}
          step={1}
          className="w-full"
        />
      </div>

      {/* Horizontal position slider */}
      <div className="space-y-1.5">
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <MoveHorizontal className="h-3 w-3" />
          <span>Horizontal Position</span>
          <span className="ml-auto tabular-nums">{pos.x}%</span>
        </div>
        <Slider
          value={[pos.x]}
          onValueChange={([x]) => handleChange({ x })}
          min={0}
          max={100}
          step={1}
          className="w-full"
        />
      </div>

      {/* Scale slider */}
      <div className="space-y-1.5">
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <ZoomIn className="h-3 w-3" />
          <span>Zoom</span>
          <span className="ml-auto tabular-nums">{pos.scale.toFixed(1)}x</span>
        </div>
        <Slider
          value={[pos.scale * 100]}
          onValueChange={([v]) => handleChange({ scale: Math.round(v) / 100 })}
          min={100}
          max={200}
          step={5}
          className="w-full"
        />
      </div>
    </div>
  );
}
