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

  const getRangeColor = (v: number) => {
    if (v <= 10) return "#22c55e";
    if (v <= 33) return "#eab308";
    return "#ef4444";
  };

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
          className="absolute left-0 top-0 h-full rounded-full transition-all duration-150"
          style={{
            width: `${pct}%`,
            backgroundColor: getRangeColor(value),
          }}
        />
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(parseFloat(e.target.value))}
          className="absolute inset-0 h-full w-full cursor-pointer appearance-none bg-transparent [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-primary [&::-webkit-slider-thumb]:bg-background [&::-webkit-slider-thumb]:shadow-sm"
        />
      </div>

      <div className="flex justify-between text-[10px] text-muted-foreground">
        <span>Default: {defaultValue.toFixed(1)}{suffix}</span>
        {isOverridden && <span className="text-primary">Override active</span>}
      </div>
    </div>
  );
}
