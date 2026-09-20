import Hero from "@/components/Hero";
import WhyUs from "@/components/WhyUs";
import Customers from "@/components/Customers";
import Features from "@/components/Features";
import SocialProof from "@/components/SocialProof";
import FAQ from "@/components/FAQ";
import ConsultationSection from "@/components/ConsultationSection";
import {
  getHeroSlides,
  getHeroSettings,
  getFaqItems,
  getWhyUsContent,
  getCustomersContent,
  getFeaturesContent,
  getSocialProofContent,
  getConsultationContent,
} from "@/lib/site-content";
import { debugSlowLoad } from "@/lib/debug-slow-load";

export default async function Home() {
  await debugSlowLoad();

  const [
    heroSlides,
    heroSettings,
    faqItems,
    whyUsContent,
    customersContent,
    featuresContent,
    socialProofContent,
    consultationContent,
  ] =
    await Promise.all([
      getHeroSlides(),
      getHeroSettings(),
      getFaqItems(),
      getWhyUsContent(),
      getCustomersContent(),
      getFeaturesContent(),
      getSocialProofContent(),
      getConsultationContent(),
    ]);

  return (
    <>
      <Hero slides={heroSlides} autoplaySeconds={heroSettings.autoplaySeconds} />
      <WhyUs content={whyUsContent} />
      <Customers content={customersContent} />
      <Features content={featuresContent} />
      <SocialProof content={socialProofContent} />
      <FAQ items={faqItems} />
      <ConsultationSection content={consultationContent} />
    </>
  );
}
