
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqs = [
  {
    question: "What makes Soundraiser's Smart Links special?",
    answer: "Our Smart Links combine powerful marketing tools with beautiful, customizable designs. Pro features include Meta Pixel integration for retargeting, email capture, and automatic social media card generation - all while maintaining a sleek, professional look that matches your brand."
  },
  {
    question: "How can I promote my music effectively using Smart Links?",
    answer: "Our Smart Links offer multiple promotion tools: automatically generated social media cards for platforms like Instagram and TikTok (Pro feature), built-in Meta Pixel for retargeting campaigns (Pro feature), email capture for building your fan base (Pro feature), and detailed analytics to understand your audience's behavior across all streaming platforms."
  },
  {
    question: "What analytics and insights do I get?",
    answer: "You get comprehensive analytics including real-time views, clicks, geographic data, device types, platform preferences, and conversion rates. Our dashboard shows you detailed performance metrics, helping you understand where your fans are coming from and how they interact with your music."
  },
  {
    question: "How do the social media features work?",
    answer: "Our platform automatically generates eye-catching social cards for your music, optimized for Instagram, X (Twitter), TikTok, Facebook, and Snapchat. These visually appealing cards help your links stand out in social media feeds, increasing engagement and click-through rates."
  },
  {
    question: "Which music platforms are supported?",
    answer: "We support all major music streaming services including Spotify, Apple Music, Amazon Music, YouTube Music, Deezer, Tidal, SoundCloud, and many more. Your fans are automatically directed to their preferred platform, ensuring a seamless listening experience."
  },
  {
    question: "How does fan retargeting work?",
    answer: "With our Pro plan's Meta Pixel integration, you can track conversions and create custom audiences for retargeting on Facebook and Instagram. This allows you to reach fans who've interacted with your Smart Links, making your advertising more effective and targeted."
  },
  {
    question: "What's included in the free plan?",
    answer: "Our free plan includes up to 10 Smart Links, basic analytics, and access to major streaming platforms. You can start promoting your music professionally without any upfront cost or credit card required."
  },
  {
    question: "How do I get started with my first Smart Link?",
    answer: "Getting started is simple - just paste your Spotify track URL and we'll automatically fetch all the streaming links for other platforms. Your Smart Link is ready to share in minutes, and Pro users can enable additional features like Meta Pixel tracking and email capture."
  },
  {
    question: "Do you offer any additional promotion services?",
    answer: "Yes! Besides Smart Links, we offer Spotify Playlist Promotion services to help get your music in front of genuine listeners. Our promotion service connects you with verified playlist curators, provides detailed curator feedback, and ensures your music reaches authentic, engaged audiences."
  }
];

export const FAQ = () => {
  return (
    <section className="py-24 px-4">
      <div className="max-w-3xl mx-auto">
        <h2 className="text-3xl md:text-4xl font-bold mb-12 text-night text-center font-heading">
          Frequently Asked Questions
        </h2>
        <Accordion type="single" collapsible>
          {faqs.map((faq, index) => (
            <AccordionItem 
              key={index} 
              value={`item-${index}`}
              className="border-b border-neutral-200"
            >
              <AccordionTrigger className="text-left hover:underline hover:no-underline py-6 font-heading text-lg">
                {faq.question}
              </AccordionTrigger>
              <AccordionContent className="pb-6 text-neutral-600 text-base leading-relaxed">
                {faq.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
};
