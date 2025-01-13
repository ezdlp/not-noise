import React from 'react';

interface SmartLinkHeaderProps {
  title: string;
  artistName?: string;
  artworkUrl: string;
}

const SmartLinkHeader = ({ title, artistName, artworkUrl }: SmartLinkHeaderProps) => {
  return (
    <div className="text-center mb-8">
      <img
        src={artworkUrl}
        alt={`${title} cover`}
        className="w-72 h-72 mx-auto rounded-2xl shadow-xl mb-6 object-cover"
      />
      <h1 className="text-2xl font-bold mb-1 text-gray-900">{title}</h1>
      {artistName && <p className="text-lg text-gray-600">{artistName}</p>}
    </div>
  );
};

export default SmartLinkHeader;