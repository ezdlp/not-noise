
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export type TimeRangeValue = 'today' | '7d' | '28d' | 'all';

interface TimeRange {
  value: TimeRangeValue;
  label: string;
  days?: number;
}

export const timeRanges: TimeRange[] = [
  { value: 'today', label: 'Today' },
  { value: '7d', label: 'Last 7 days', days: 7 },
  { value: '28d', label: 'Last 28 days', days: 28 },
  { value: 'all', label: 'All Time' }
];

interface TimeRangeSelectProps {
  value: TimeRangeValue;
  onChange: (value: TimeRangeValue) => void;
}

export function TimeRangeSelect({ value, onChange }: TimeRangeSelectProps) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="w-[180px] h-8">
        <SelectValue/>
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
