import { LandingNavbar } from './navbar';
import { HeroSection } from './hero';
import { FeaturesSection } from './features';
import { AnalyticsSection } from './analytics-section';
import { AiSection } from './ai-section';
import { PricingSection } from './pricing-section';
import { SocialProofSection } from './social-proof';
import { CtaSection } from './cta-section';
import { LandingFooter } from './footer';

export function LandingPage() {
  return (
    <div className="min-h-screen bg-[#080812] text-white overflow-x-hidden">
      <LandingNavbar />
      <HeroSection />
      <FeaturesSection />
      <AnalyticsSection />
      <AiSection />
      <SocialProofSection />
      <PricingSection />
      <CtaSection />
      <LandingFooter />
    </div>
  );
}
