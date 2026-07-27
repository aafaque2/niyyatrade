"use client";

interface ThresholdSliderProps {
  label: string;
  description: string;
  value: number;
  defaultValue: number;
  min?: number;
  max?: number;
  step?: number;
  suffix?: string;
  onChange: (value: number) => void;
}

export function ThresholdSlider({
  label,
  description,
  value,
  defaultValue,
  min = 0,
  max = 100,
  step = 0.1,
  suffix = "%",
  onChange,
}: ThresholdSliderProps) {
  const isOverridden = value !== defaultValue;
  const pct = ((value - min) / (max - min)) * 100;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div>
          <label className="text-sm font-medium">{label}</label>
          <p className="text-xs text-muted-foreground">{description}</p>
        </div>
        <div className="text-right">
          <span className="font-mono text-sm">
            {value.toFixed(1)}
            {suffix}
          </span>
        </div>
      </div>

      <div className="relative h-2">
        <div className="absolute inset-0 rounded-full bg-border" />
        <div
          className="absolute left-0 top-0 h-full rounded-full bg-primary"
          style={{ width: `${pct}%` }}
        />
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(parseFloat(e.target.value))}
          className="absolute inset-0 h-full w-full cursor-pointer appearance-none bg-transparent [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-primary [&::-webkit-slider-thumb]:bg-background [&::-webkit-slider-thumb]:shadow-sm [&::-webkit-slider-thumb]:transition-transform [&::-webkit-slider-thumb]:duration-100 [&::-webkit-slider-thumb]:hover:scale-125 [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:appearance-none [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-primary [&::-moz-range-thumb]:bg-background [&::-moz-range-thumb]:shadow-sm"
        />
      </div>

      <div className="flex justify-between text-[10px] text-muted-foreground">
        <span>Default: {defaultValue.toFixed(1)}{suffix}</span>
        {isOverridden && <span className="text-primary">Override active</span>}
      </div>
    </div>
  );
}
