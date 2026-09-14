import Hero from "@/components/Hero";
import WhyUs from "@/components/WhyUs";
import Customers from "@/components/Customers";
import Features from "@/components/Features";
import SocialProof from "@/components/SocialProof";
import FAQ from "@/components/FAQ";
import ConsultationSection from "@/components/ConsultationSection";
import { getHeroSlides, getFaqItems } from "@/lib/site-content";
import { debugSlowLoad } from "@/lib/debug-slow-load";

export default async function Home() {
  await debugSlowLoad();

  const [heroSlides, faqItems] = await Promise.all([getHeroSlides(), getFaqItems()]);

  return (
    <>
      <Hero slides={heroSlides} />
      <WhyUs />
      <Customers />
      <Features />
      <SocialProof />
      <FAQ items={faqItems} />
      <ConsultationSection />
    </>
  );
}
