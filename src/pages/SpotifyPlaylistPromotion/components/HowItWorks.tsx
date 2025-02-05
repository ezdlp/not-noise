import React from 'react';
import { BarChart2, FileText, Music, Users } from "lucide-react";
import CTAScrollButton from './CTAScrollButton';

const steps = [
  {
    number: 1,
    icon: Music,
    title: "Submit your song",
    description: "Start by selecting the track you want to promote. Just search for the song or paste the Spotify link. Easy!"
  },
  {
    number: 2,
    icon: BarChart2,
    title: "Choose Your Campaign Size",
    description: "Select the scale of your campaign by deciding how many playlist curators we should pitch your music to. Whether you're targeting a niche audience or looking for broader exposure, we have the right option for you."
  },
  {
    number: 3,
    icon: Users,
    title: "Expert Review and Personalized Pitching",
    description: "Our industry experts listen to your track and identify the best curators in our network of over 5,000. We then pitch your song in a personalized way, aligning it with the curators' playlist themes and audiences."
  },
  {
    number: 4,
    icon: FileText,
    title: "Curator Feedback and Report",
    description: "Curators review your track and provide feedback. At the end of the campaign, receive a detailed report with playlist placements, curator feedback, key takeaways, and actionable recommendations from in-house A&R & Music Production teams."
  }
];

const HowItWorks: React.FC = () => {
  return (
    <section className="py-20 px-4 md:px-8 lg:px-12 bg-white">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16 animate-fade-in">
          <h2 className="text-4xl font-bold mb-4 font-heading">
            How It Works
          </h2>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            Your journey to playlist success in four simple steps
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 relative">
          {steps.map((step, index) => {
            const Icon = step.icon;
            return (
              <div
                key={step.number}
                className="relative flex flex-col items-center text-center animate-fade-in"
                style={{ animationDelay: `${index * 150}ms` }}
              >
                {/* Connector Lines (Hidden on Mobile) */}
                {index < steps.length - 1 && (
                  <div className="hidden lg:block absolute top-14 left-1/2 w-full h-0.5 bg-gradient-to-r from-primary/20 to-primary/40" />
                )}
                
                {/* Step Number Circle */}
                <div className="relative z-10 w-28 h-28 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center mb-6 shadow-lg transform transition-transform duration-300 hover:scale-105">
                  <span className="text-3xl font-bold text-white">
                    {step.number}
                  </span>
                </div>
                
                {/* Icon */}
                <div className="p-4 bg-primary/10 rounded-full mb-6">
                  <Icon className="w-8 h-8 text-primary" />
                </div>

                {/* Content */}
                <h3 className="text-xl font-bold mb-4 text-gray-900">
                  {step.title}
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  {step.description}
                </p>
              </div>
            );
          })}
        </div>

        <div className="mt-16 flex justify-center">
          <CTAScrollButton text="Start Your Promotion Journey" />
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
