
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export type TimeRangeValue = '24h' | '7d' | '28d' | '12m';

interface TimeRange {
  value: TimeRangeValue;
  label: string;
  days: number;
}

export const timeRanges: TimeRange[] = [
  { value: '24h', label: '24 hours', days: 1 },
  { value: '7d', label: '7 days', days: 7 },
  { value: '28d', label: '28 days', days: 28 },
  { value: '12m', label: '12 months', days: 365 }
];

interface TimeRangeSelectProps {
  value: TimeRangeValue;
  onChange: (value: TimeRangeValue) => void;
}

export function TimeRangeSelect({ value, onChange }: TimeRangeSelectProps) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="w-[120px] h-8 text-sm">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {timeRanges.map((range) => (
          <SelectItem 
            key={range.value} 
            value={range.value}
            className="text-sm"
          >
            {range.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
