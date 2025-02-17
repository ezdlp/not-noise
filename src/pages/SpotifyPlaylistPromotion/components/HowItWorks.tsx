
import React from 'react';
import { BarChart2, FileText, Music, Users } from "lucide-react";
import { Card } from '@/components/ui/card';

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
    <section className="py-16 md:py-24 px-4 md:px-8 lg:px-12 bg-white border-t border-gray-100">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16 animate-fade-in">
          <h2 className="text-4xl font-bold mb-4 font-heading">
            How It Works
          </h2>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            Your journey to playlist success in four simple steps
          </p>
        </div>

        <div className="relative">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative">
            {steps.map((step, index) => {
              const Icon = step.icon;
              return (
                <Card
                  key={step.number}
                  className="p-6 bg-white hover:shadow-md transition-all duration-300 animate-fade-in flex flex-col"
                  style={{ animationDelay: `${index * 150}ms` }}
                >
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0">
                      <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                        <Icon className="w-6 h-6 text-primary" />
                      </div>
                    </div>
                    <div className="flex-grow">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-sm font-medium text-primary">
                          Step {step.number}
                        </span>
                      </div>
                      <h3 className="text-xl font-bold mb-3 text-gray-900">
                        {step.title}
                      </h3>
                      <p className="text-gray-600 leading-relaxed">
                        {step.description}
                      </p>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
