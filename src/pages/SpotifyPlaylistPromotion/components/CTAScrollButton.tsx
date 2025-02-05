
import React from 'react';
import { ArrowUp } from 'lucide-react';

interface CTAScrollButtonProps {
  text: string;
  className?: string;
}

const CTAScrollButton = ({ text, className = '' }: CTAScrollButtonProps) => {
  const scrollToHero = () => {
    const heroElement = document.getElementById('hero-search');
    if (heroElement) {
      heroElement.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <button
      onClick={scrollToHero}
      className={`flex items-center space-x-2 bg-primary hover:bg-primary/90 text-white px-8 py-3 rounded-full font-medium 
        transition-all duration-300 hover:scale-105 shadow-lg group ${className}`}
    >
      <span>{text}</span>
      <ArrowUp className="w-4 h-4 transition-transform group-hover:-translate-y-1" />
    </button>
  );
};

export default CTAScrollButton;
