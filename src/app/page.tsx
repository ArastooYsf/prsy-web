import Hero from "@/components/Hero";
import WhyUs from "@/components/WhyUs";
import Features from "@/components/Features";
import SocialProof from "@/components/SocialProof";
import FAQ from "@/components/FAQ";
import ConsultationSection from "@/components/ConsultationSection";
import { getHeroSlides } from "@/lib/site-content";

export default async function Home() {
  const heroSlides = await getHeroSlides();

  return (
    <>
      <Hero slides={heroSlides} />
      <WhyUs />
      <Features />
      <SocialProof />
      <FAQ />
      <ConsultationSection />
    </>
  );
}
