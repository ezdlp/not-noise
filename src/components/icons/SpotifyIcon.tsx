
import React from 'react';

interface SpotifyIconProps extends React.SVGProps<SVGSVGElement> {
  size?: number;
  strokeWidth?: number;
  color?: string;
}

export const SpotifyIcon = ({
  size = 24,
  strokeWidth = 2,
  color = 'currentColor',
  ...props
}: SpotifyIconProps) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <circle cx="12" cy="12" r="10" />
      <path d="M8 14.5c2.5-1 5.5-.5 7.5.5" />
      <path d="M8 11.5c3.5-1.5 8-.5 11 1.5" />
      <path d="M8 8.5c4.5-2 10-1.5 14 1.5" />
    </svg>
  );
};
