import Container from "@/components/layout/Container";
import Title from "@/components/common/Title";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { faqsData } from "@/constants";

export default function FaqsPage() {
  return (
    <Container className="max-w-4xl sm:px-6 lg:px-8 py-12">
      <Title className="text-3xl mb-6">Frequently Asked Questions</Title>
      <Accordion
        type="single"
        collapsible
        className="w-full"
        defaultValue="item-0"
      >
        {faqsData.map((faq, index) => (
          <AccordionItem key={faq.question} value={`item-${index}`} className="group">
            <AccordionTrigger className="text-left text-lg font-semibold text-black/80 group-hover:text-black hover:no-underline hoverEffect">
              {faq.question}
            </AccordionTrigger>
            <AccordionContent className="text-gray-600">
              {faq.answer}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </Container>
  );
}
