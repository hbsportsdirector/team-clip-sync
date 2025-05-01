// src/components/TrimSlider.tsx
import * as Slider from '@radix-ui/react-slider';
import React from 'react';

interface TrimSliderProps {
  duration: number;
  values: [number, number];
  onChange: (vals: [number, number]) => void;
}

export default function TrimSlider({ duration, values, onChange }: TrimSliderProps) {
  return (
    <Slider.Root
      className="relative flex items-center select-none touch-none w-full h-4"
      max={duration}
      step={0.1}
      value={values}
      onValueChange={onChange}
    >
      <Slider.Track className="relative bg-white/30 grow rounded-full h-1">
        <Slider.Range className="absolute bg-primary rounded-full h-full" />
      </Slider.Track>
      <Slider.Thumb className="block w-4 h-4 bg-primary rounded-full shadow-md" />
      <Slider.Thumb className="block w-4 h-4 bg-primary rounded-full shadow-md" />
    </Slider.Root>
  );
}
