import Hero from "@/components/Hero";
import Features from "@/components/Features";
import SocialProof from "@/components/SocialProof";
import FAQ from "@/components/FAQ";
import ConsultationSection from "@/components/ConsultationSection";
import { getHeroOverrides } from "@/lib/site-content";

export default async function Home() {
  const heroOverrides = await getHeroOverrides();

  return (
    <>
      <Hero overrides={heroOverrides} />
      <Features />
      <SocialProof />
      <FAQ />
      <ConsultationSection />
    </>
  );
}
