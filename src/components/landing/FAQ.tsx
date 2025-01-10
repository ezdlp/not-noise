import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqs = [
  {
    question: "What exactly is a Music Smart Link?",
    answer: "A Music Smart Link is a single powerful link that directs fans to your music across all major streaming platforms. It simplifies how you share your music and gives your audience a one-stop destination to listen to your tracks."
  },
  {
    question: "Is the Smart Link service really free?",
    answer: "Yes, our basic service is completely free to use. You can create unlimited Smart Links without any cost."
  },
  {
    question: "Can I track how my Smart Link is performing?",
    answer: "Yes, you get detailed analytics for each Smart Link, showing you views, clicks, and geographic data of your listeners."
  },
  {
    question: "How does a Music Smart Link benefit my music promotion?",
    answer: "It streamlines your promotion by giving you one professional link to share everywhere, making it easier for fans to find and stream your music on their preferred platform."
  },
  {
    question: "What streaming platforms can be included in a Music Smart Link?",
    answer: "We support all major streaming platforms including Spotify, Apple Music, Amazon Music, YouTube Music, and many more."
  }
];

export const FAQ = () => {
  return (
    <section className="py-20 px-4 bg-white">
      <div className="max-w-3xl mx-auto">
        <h2 className="text-3xl md:text-4xl font-bold mb-12">
          Frequently Asked Questions
        </h2>
        <Accordion type="single" collapsible className="w-full">
          {faqs.map((faq, index) => (
            <AccordionItem key={index} value={`item-${index}`}>
              <AccordionTrigger className="text-left">
                {faq.question}
              </AccordionTrigger>
              <AccordionContent>
                {faq.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
};