
import React from 'react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

type FAQItem = {
  question: string;
  answer: React.ReactNode;
};

const faqItems: FAQItem[] = [
  {
    question: "Is this service safe for my Spotify account?",
    answer: "Absolutely. We adhere 100% to Spotify's guidelines, ensuring that your artist account remains safe and compliant. Our promotion methods focus on organic engagement and real listeners only."
  },
  {
    question: "How do you ensure the playlists are free from bots?",
    answer: <>We use <a href="http://artist.tools" className="text-primary hover:underline">artist.tools</a> to rigorously vet every playlist in our network. This tool helps us detect and eliminate any playlists with fake followers or artificial engagement, guaranteeing that your music is placed in front of genuine listeners.</>
  },
  {
    question: "How soon will I see results?",
    answer: "Typically, artists start seeing significant engagement within a few weeks of their music being placed on playlists. The exact timing can vary based on the campaign size and the specific playlists your music is added to."
  },
  {
    question: "What if my song isn't added to any playlists?",
    answer: "While we cannot guarantee specific placements, we ensure your music is pitched to the most suitable curators for your genre and style. Even if a song isn't added to a playlist, you'll receive detailed feedback and recommendations and actionable points from both curators and our A&R team to improve your chances in future campaigns."
  },
  {
    question: "What kind of feedback will I receive from curators?",
    answer: "Curators provide honest, constructive feedback on what they liked about your track and areas that could be improved. This insight is valuable for understanding how your music is perceived and how you can enhance it for better engagement."
  },
  {
    question: "Can I choose which curators or playlists my music is pitched to?",
    answer: "We have a vast network of over 30,000 playlists and utilize a proprietary AI model to ensure the best match. Our advanced AI analyzes your music and automatically connects it with curators who are most likely to be interested in your song, based on its genre, mood, and style. This system ensures your music reaches the right audience without you needing to choose specific curators or playlists manually."
  },
  {
    question: "What does the comprehensive report include?",
    answer: <>
      <p>At the end of your campaign, you'll receive a detailed report outlining:</p>
      <ul className="list-disc pl-6 mt-2 space-y-1">
        <li><strong>Playlist Additions</strong>: Lists of where your song has been placed.</li>
        <li><strong>Curator Feedback</strong>: Summary of feedback from curators.</li>
        <li><strong>Key Takeaways</strong>: Highlights of the campaign's successes and areas for improvement.</li>
        <li><strong>Actionable Recommendations</strong>: Expert advice on how to enhance your music and strategies for future promotions.</li>
      </ul>
    </>
  },
  {
    question: "What if I'm not satisfied with the service?",
    answer: "Your satisfaction is our top priority. If our service doesn't meet your expectations, we offer a money-back guarantee, ensuring you can invest in your promotion with confidence."
  },
  {
    question: "How do I get started?",
    answer: <>Simply <a href="#" className="text-primary hover:underline">Submit Your Music</a> on our website, choose your campaign size, and let us handle the rest. Our team is here to support you every step of the way.</>
  }
];

const FAQ: React.FC = () => {
  return (
    <section className="py-20 px-4 md:px-8 lg:px-12 bg-[#F1F0FB]">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold mb-4 font-heading">
            Frequently Asked Questions
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            We understand that navigating music promotion can be challenging, especially in an industry full of uncertainty. Below are answers to some of the most common questions about our service, ensuring you have all the information you need to make an informed decision.
          </p>
        </div>

        <Accordion type="single" collapsible className="space-y-4">
          {faqItems.map((item, index) => (
            <AccordionItem 
              key={index} 
              value={`item-${index}`}
              className="bg-white rounded-lg p-6 shadow-sm data-[state=open]:shadow-md transition-shadow"
            >
              <AccordionTrigger className="text-left hover:text-primary data-[state=open]:text-primary font-heading">
                {item.question}
              </AccordionTrigger>
              <AccordionContent className="text-gray-600 leading-relaxed pt-4">
                {item.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
};

export default FAQ;
