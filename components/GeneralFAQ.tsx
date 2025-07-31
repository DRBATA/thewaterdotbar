"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { HelpCircle } from "lucide-react"

const generalFAQData = {
  "Hydration Science & Personalization": [
    {
      question: "What is functional hydration?",
      answer: "Functional hydration goes beyond just drinking water. It's about optimizing your body's hydration at the cellular level using precise electrolyte balance, probiotics, and bioactive compounds that support energy production, recovery, and metabolic flexibility."
    },
    {
      question: "How does the AI coach calculate my exact needs?",
      answer: "Our AI uses your lean body mass to calculate precise electrolyte targets: Baseline Sodium = 24mg × LBM(kg), Baseline Potassium = 72mg × LBM(kg). For a 70kg lean person, that's ~1,680mg sodium and ~5,040mg potassium daily. We then add back what you lose through sweat based on your activity intensity."
    },
    {
      question: "How do you account for my workout intensity?",
      answer: "We adjust for sweat losses: Light activity (+350mg sodium, +175mg potassium), Moderate (+700mg sodium, +350mg potassium), Intense (+1,050mg sodium, +525mg potassium). This ensures you replace exactly what you lose, not just guess."
    },
    {
      question: "Why do you balance food and supplements?",
      answer: "We recommend 50% of your electrolytes from whole foods (fruits, vegetables) and 50% from our targeted supplements. This approach optimizes absorption and provides sustained energy while supporting your natural dietary patterns."
    }
  ],
  "Products & Preparation": [
    {
      question: "What will I find at a Water Bar venue?",
      answer: "Single-serve sachets (kept by the venue) and ready-to-drink cans/bottles stored chilled in the fridge. Staff can help you pick the right option and prepare sachets with chilled still water."
    },
    {
      question: "How do I prepare Rite sachets properly?",
      answer: "You prepare your own drinks using 500ml of available water options (Prana Spring Water for sachets, Perrier options, or filtered water for copper bottles). Mix one sachet into the water for optimal flavor and nutrient balance. Avoid sparkling water as it can foam and clump."
    },
    {
      question: "Can I bring my own bottle?",
      answer: "Absolutely! Use a clean bottle, fill with 500ml of available water, add the sachet, close, and shake. Staff can help you locate the right water and sachets depending on your venue's setup."
    },
    {
      question: "Are your products suitable for dietary restrictions?",
      answer: "Many products are gluten-free, vegan-friendly, and free from artificial additives. Each product has detailed FAQ information - check individual product pages for specific allergen and dietary information."
    }
  ],
  "Venue Experience & Ordering": [
    {
      question: "How do I find a Water Bar venue?",
      answer: "Tap 'Find Venues' and allow location access. We'll sort venues by distance so the closest appears first. You can also search manually if you prefer not to share your location."
    },
    {
      question: "How do I purchase and claim my items?",
      answer: "Purchase through our website at thewater.bar using Stripe checkout. You'll receive a numeric PIN code. Show this PIN to venue staff, who will verify your email and confirm the correct products before handing them over. One PIN can cover multiple quantities of the same product."
    },
    {
      question: "How do venue setups work?",
      answer: "Each venue setup varies for ease of use - sachets may be on product stands, displayed openly, or kept by staff. Regardless of layout, staff will help you locate products and ensure you get your items once your PIN and email are verified through their phone-based claim system."
    }
  ],
  "Health & Safety": [
    {
      question: "Any health cautions I should know about?",
      answer: "If you're pregnant, nursing, on medication, or have specific conditions (e.g., caffeine sensitivity, kidney issues), please consult your healthcare provider and check individual product FAQs before consuming."
    },
    {
      question: "What if something isn't right with my drink?",
      answer: "Please speak to venue staff immediately so they can replace it on the spot. If you need further assistance, contact us with the venue details and we'll follow up."
    },
    {
      question: "Are venues accessible?",
      answer: "Most venues provide accessibility information on their page, including wheelchair access and step-free entry details."
    }
  ]
}

export function GeneralFAQ() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button 
          variant="outline" 
          size="sm" 
          className="bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200"
        >
          <HelpCircle className="w-4 h-4 mr-2" />
          General FAQ
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>The Water Bar - Frequently Asked Questions</DialogTitle>
        </DialogHeader>
        <div className="mt-4">
          {Object.entries(generalFAQData).map(([section, questions]) => (
            <div key={section} className="mb-6">
              <h3 className="text-lg font-semibold mb-3 text-stone-800">{section}</h3>
              <Accordion type="single" collapsible className="w-full">
                {questions.map((faq, index) => (
                  <AccordionItem key={index} value={`item-${index}`}>
                    <AccordionTrigger className="text-left text-stone-700">
                      {faq.question}
                    </AccordionTrigger>
                    <AccordionContent className="text-stone-600">
                      {faq.answer}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  )
}
