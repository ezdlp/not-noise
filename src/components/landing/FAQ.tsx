import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqs = [
  {
    question: "What makes Soundraiser's Smart Links different?",
    answer: "Our Smart Links are built for modern music marketing, featuring Meta Pixel integration for retargeting, email capture capabilities, and comprehensive analytics - all in one streamlined solution that takes less than 3 minutes to set up."
  },
  {
    question: "Can I track my Smart Link's performance?",
    answer: "Yes! You get detailed analytics including views, clicks, geographic data, and platform preferences. Plus, with Meta Pixel integration, you can create custom audiences and retarget your fans effectively."
  },
  {
    question: "How does the email capture feature work?",
    answer: "You can enable email capture on any Smart Link to collect fan emails directly. Customize your message and description to encourage sign-ups, helping you build your mailing list while promoting your music."
  },
  {
    question: "Which streaming platforms are supported?",
    answer: "We support all major music platforms including Spotify, Apple Music, Amazon Music, YouTube Music, Deezer, Tidal, and many more. Your fans will automatically be directed to their preferred platform."
  },
  {
    question: "Is it really free to use?",
    answer: "Yes! You can create unlimited Smart Links with all core features including Meta Pixel integration and email capture at no cost. No credit card required to get started."
  }
];

export const FAQ = () => {
  return (
    <section className="py-20 px-4 bg-onyx">
      <div className="max-w-3xl mx-auto">
        <h2 className="text-3xl md:text-4xl font-bold mb-12 text-white text-center">
          Frequently Asked Questions
        </h2>
        <Accordion type="single" collapsible className="w-full space-y-4">
          {faqs.map((faq, index) => (
            <AccordionItem 
              key={index} 
              value={`item-${index}`}
              className="bg-white rounded-lg px-6"
            >
              <AccordionTrigger className="text-left hover:text-primary">
                {faq.question}
              </AccordionTrigger>
              <AccordionContent className="text-gray-600">
                {faq.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
};