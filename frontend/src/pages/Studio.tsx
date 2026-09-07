import HeroStatement from '@/pages/studio/HeroStatement'
import StatsBar from '@/pages/studio/StatsBar'
import Boundary from '@/pages/studio/Boundary'
import DoesDoesNot from '@/pages/studio/DoesDoesNot'
import TerminologyGrid from '@/pages/studio/TerminologyGrid'
import ArchitectureLayers from '@/pages/studio/ArchitectureLayers'
import AuditPhilosophy from '@/pages/studio/AuditPhilosophy'
import GovernanceCta from '@/pages/studio/GovernanceCta'

/** /studio, the ARCWELL operating model: boundary, metrics, does/does-not, terminology, architecture, audit philosophy, governance. */
export default function Studio() {
  return (
    <>
      <HeroStatement />
      <StatsBar />
      <Boundary />
      <DoesDoesNot />
      <TerminologyGrid />
      <ArchitectureLayers />
      <AuditPhilosophy />
      <GovernanceCta />
    </>
  )
}
