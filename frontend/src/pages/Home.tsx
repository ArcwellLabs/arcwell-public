import Hero from '@/pages/home/Hero'
import LogoMarquee from '@/pages/home/LogoMarquee'
import Approach from '@/pages/home/Approach'
import Founder from '@/pages/home/Founder'
import CaseStudies from '@/pages/home/CaseStudies'
import Metrics from '@/pages/home/Metrics'
import Services from '@/pages/home/Services'
import Process from '@/pages/home/Process'
import Pricing from '@/pages/home/Pricing'
import Testimonials from '@/pages/home/Testimonials'
import Faq from '@/pages/home/Faq'
import ArticlesTeaser from '@/pages/home/ArticlesTeaser'

export default function Home() {
  return (
    <>
      <Hero />
      <LogoMarquee />
      <Approach />
      <Founder />
      <CaseStudies />
      <Metrics />
      <Services />
      <Process />
      <Pricing />
      <Testimonials />
      <Faq />
      <ArticlesTeaser />
    </>
  )
}
