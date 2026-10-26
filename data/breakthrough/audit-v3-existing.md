# v3 existing-event assessment and date audit

Review date: 2026-10-27. Scope: the 390 pre-existing milestone records and one new sustained Tycho observational dataset. This audit changes no original event source file. `event-assessments.json` is the explicit assessment overlay; `events-historical-foundations.json` adds the missing dataset. Later `editorial-event-patches.json` can refine the ten previously undated records without duplicating them.

## Assessment policy

- Scores use the fixed editorial levels 1, 2, 4, 8 and 16. They evaluate a physical result, observational foundation or method, not the prestige, fame, author count or number of papers. Each of the 390 records has an explicit bilingual assessment with route, confidence and version. Existing specific result rationales are retained where adequate; the new level assessment is recorded separately.
- Levels: 1 focused advance; 2 important improvement; 4 major advance within a field; 8 key law, decisive evidence or a new direction; 16 a revolution in the basic framework. These are review judgments, not publisher-provided scores.
- Historical route (before 1600): evaluate systematic quantitative knowledge, observations and instruments in their historical setting; a modern journal publication is not required. Classical route (1600–1899): evaluate laws, empirical tests and experimental/mathematical methods. Modern route (1900 onward): evaluate distinct original results and decisive tests; publication volume never multiplies a result. These routes describe evidence evaluation, not automatic era bonuses.
- The five level-16 records are Newton’s unified mechanics, Maxwell’s electromagnetic unification, special relativity, general relativity and matrix quantum mechanics. Wave mechanics receives 8 for an independent, broadly useful formulation rather than duplicating the same quantum-framework maximum.
- Copernicus receives 8 for the moving-Earth mathematical reorganization, not for every circular-orbit detail. Kepler’s first two laws receive 8 jointly and the third law 4. Tycho’s calibrated planetary dataset receives a separate total score of 8. His nova/comet conclusions are distinct results.
- Higgs mechanism (1964) and Higgs-boson discovery (2012) each receive 8 and have different family identifiers. Neither theorists’ life dates nor the Nobel year can move these contributions. ATLAS and CMS do not double the experimental discovery score.
- Original `indexEligible:false` historical claims remain excluded. Their nonzero assessment level is metadata only and must not enter the physical-result total. Intellectual or methodological contributions must be separately named and assessed.
- Existing reviewed papers, institutional records and journal collections are reused; the whole set is assessed from titles, specific rationales, attribution and date notes. This audit does not claim a new full-text reading of all 390 original papers. Newly checked chronology sources are explicitly appended on the affected overlay records.

## Date policy and substantive corrections

Dates distinguish achieved/observed results from their announcement and publication. `first-public-record` is an explicit fallback where an earlier completed result cannot be reliably dated; it does not assert that the work was first done that year. Dating uncertainty and importance are independent. Each overlay carries `dateConfidence`: documented, approximate-source, estimated, or undated; `assessment.confidence` refers to the importance judgment. Editorial intervals are not source-reported confidence intervals.

| Record | Prior index date | v3 index allocation | Reporting metadata / reason |
|---|---:|---|---|
| Tycho nova | 1573 | 1572 observation | 1573 book remains publication metadata |
| Tycho comet | 1588 | 1577 observation | 1588 book remains publication metadata |
| Tycho planetary dataset | missing | one total 8-point budget across 1576–1597 | Hven core phase; original logbooks span wider 1563–1601 career |
| Copernican heliocentric proposal | 1543 | editorial 1502–1514 theory-formation interval | Commentariolus recorded by 1514; full De revolutionibus published 1543 |
| Kepler first two laws | 1609 | editorial dating interval 1602–1609 | 1609 public book; avoids a fictitious common exact discovery date |
| Kepler third law | 1619 | 1618 achieved | independently supported 15 May 1618 confirmation; 1619 publication |
| Newton framework | 1687 | 1687 first public record | complete public system, not a date for all prior insights |
| Grimaldi diffraction | 1665 | editorial 1650–1663 formation interval | 1665 is posthumous publication; author died in 1663 |
| Fraunhofer spectrum | 1817 | 1814 observation/chart | 1817 paper retained |
| Galactic radio emission | 1933 | 1932 identification | 1931 signals, 1933 public report retained |
| Parity violation | 1956–1957 | 1956 proposal and December experiment | 1957 final checks/publication retained |
| First direct gravitational-wave detection | 2016 | 2015 observation | GW150914, 14 September 2015; 2016 announcement/paper retained |
| Higgs theory / experiment | 1964 / 2012 | 1964 / 2012 | distinct, correctly timed milestones retained |

Compound result families receive one total score, allocated to documented stages. Fractions are editorial judgments and are not measurements of individual researchers’ credit:

- `nuclear-fission`: Allocate 75% to the 1938 experimental discovery and 25% to its 1939 basic interpretation; together these are one eight-point family, not eight points in each year.
- `renormalized-qed`: Renormalized QED formed through several theoretical and unifying contributions in 1946–1949; a single assessed budget is distributed over the formation period.
- `density-functional-theory`: Allocate half of one family budget to the 1964 Hohenberg–Kohn foundations and half to the 1965 Kohn–Sham construction.
- `bkt-transition`: Distribute one topological-transition family in stages: 40% to Berezinskii’s 1970 work and 60% to Kosterlitz–Thouless in 1973; no fictional events are added to intervening years.
- `bell-inequality-experiments`: Allocate half of one validation-family budget to Freedman–Clauser in 1972 and half to Aspect in 1982, without inventing annual experiments in between.
- `cosmic-inflation`: Treat Starobinsky 1980, Guth 1981 and new inflation 1982 as one model family with editorial allocations of 30%, 40% and 30%, not measured paper-level quantities.
- `efficient-blue-led`: Allocate one technology-family budget to p-type GaN in 1989 (40%) and high-brightness devices in 1993 (60%), rather than treating each engineering year as an equal breakthrough.
- `neutrino-flavour-oscillations`: Allocate 50% to atmospheric oscillations in 1998 and 25% each to solar flavour conversion in 2001 and 2002; the discovery family shares one total score.

For early approximate dates, bounded editorial uncertainty replaces an apparently exact point; no year inside such a range is asserted as a known completion year. The ten fully undated records are intentionally left for the coordinated editorial-event patch, rather than independently making inconsistent estimates in two overlays.

## Sources newly consulted for critical chronology

- [Royal Danish Library: original planetary-observation manuscripts](https://permalink.kb.dk/permalink/2006/manus/742/) — original logbook dates and 1563–1601 overall span.
- [University of Copenhagen, Niels Bohr Institute: Hven 1576–1597](https://nbi.ku.dk/english/www/tycho/brahe/the_life) — used only for the documented observation period; unrelated outdated biographical claims on the page are not imported.
- [Rice University Galileo Project: Tycho](https://galileo.library.rice.edu/sci/brahe.html) — nova/comet chronology, precision, calibration and Kepler’s use of the dataset.
- [Bavarian Academy of Sciences: planetary laws and original formulations](https://kepler.badw.de/en/on-johannes-kepler/the-planetary-laws.html) — Kepler’s mathematical content and 1609/1619 publications.
- [NASA APOD: third-law discovery in 1618](https://science.nasa.gov/image-article/apod-2018-may-15-keplers-house-in-linz/) — achieved date distinct from publication.
- [University of Stuttgart: Kepler historical exhibition volume](https://www.project.uni-stuttgart.de/kepler2022/dokumente/Kepler-Begleitband_screen-Version.pdf) — cites Kepler’s own recorded 15 May 1618 discovery date; the search-index excerpt was accessible, but the web text extractor could not ingest the 32 MB full volume, so this is supplementary, not a claimed complete reading.
- [Smithsonian Libraries: original Harmonices mundi](https://doi.org/10.5479/sil.135810.39088002800316) — original 1619 publication.
- [University of Bremen: Kepler biobibliography](https://www.presseforschung.uni-bremen.de/dokuwiki/doku.php?id=kepler_johannes) — stages of the first two laws.
- [Library of Congress: original Sidereus nuncius](https://www.loc.gov/item/2010667904/) and [Oxford: observing chronology](https://www.cabinet.ox.ac.uk/node/6002) — telescopic observations and 1610 publication.
- [Coulomb’s original 1785 memoir, scholarly facsimile](https://webusers.imj-prg.fr/~david.aubin/cours/Textes/Coulomb.pdf) — inverse-square measurement.
- [Fraunhofer Society](https://www.fraunhofer.de/en/about-fraunhofer/profile-structure/chronicles/joseph-von-fraunhofer.html) and [Deutsches Museum](https://www.deutsches-museum.de/en/museumsinsel/ausstellung/academy-collection) — 1814 spectrum observations/chart.
- [Max Planck Institute for Radio Astronomy](https://www.mpifr-bonn.mpg.de/582352/einfuehrung) and [NRAO archive](https://www.nrao.edu/archives/jansky-finding-aid) — Jansky observing and publication chronology.
- [NIST: The Fall of Parity](https://www.nist.gov/pml/fall-parity) and [APS: December 27, 1956](https://www.aps.org/apsnews/2001/12/fall-parity-conservation-1956) — December 1956 decisive results.
- [LIGO collaboration: GW150914](https://ligo.org/detections/gw150914/) and [original February 2016 release](https://www.ligo.caltech.edu/system/media_files/binaries/302/original/detection-press-release.pdf) — September 2015 detection.

## Coverage and review ledger

- Existing events assessed: 390; changed score: 234; unchanged score: 156.
- Level counts: {1: 20, 2: 75, 4: 222, 8: 68, 16: 5}.
- Assessment routes: {'historical': 30, 'classical': 120, 'modern': 240}.
- Assessment level is not automatically doubled from the previous scale. New source-count requirements must follow evidence quality: a single original paper can support a level-4 result; a second URL is not an independent measurement of importance. All level-8/16 results retain at least two supporting URLs after source overlays, but this does not make editorial judgments objective.

| Existing event | Prior → v3 score | v3 dating model |
|---|---:|---|
| `early-democritus-atomism` | 2 → 2 | first-public-record; uncertain-range; -500–-401; excluded |
| `early-euclid-geometric-optics` | 2 → 4 | editorial-interval; uncertain-range; -325–-275 |
| `early-archimedes-hydrostatics` | 2 → 8 | editorial-interval; uncertain-range; -260–-230 |
| `early-hipparchus-star-catalogue` | 2 → 4 | editorial-interval; uncertain-range; -150–-125 |
| `early-zhang-heng-seismoscope` | 2 → 2 | first-public-record; point; 132–132 |
| `early-ptolemy-almagest` | 2 → 2 | editorial-interval; uncertain-range; 127–151; excluded |
| `early-aryabhatiya` | 2 → 2 | first-public-record; point; 499–499 |
| `early-philoponus-physics-commentary` | 2 → 2 | first-public-record; point; 517–517 |
| `early-brahmasphutasiddhanta` | 1 → 1 | first-public-record; point; 628–628 |
| `early-ibn-sahl-refraction` | 2 → 4 | editorial-interval; uncertain-range; 980–990 |
| `early-haytham-book-optics` | 4 → 8 | first-public-record; uncertain-range; 1011–1021 |
| `early-shen-kuo-magnetic-declination` | 2 → 2 | first-public-record; uncertain-range; 1088–1095 |
| `early-roger-bacon-perspectiva` | 1 → 1 | first-public-record; point; 1267–1267 |
| `early-tartaglia-ballistics` | 2 → 2 | first-public-record; point; 1537–1537 |
| `early-copernicus-revolutions` | 4 → 8 | editorial-interval; uncertain-range; 1502–1514 |
| `early-benedetti-motion` | 1 → 1 | first-public-record; point; 1554–1554 |
| `early-brahe-new-star` | 2 → 4 | observation; point; 1572–1572 |
| `early-stevin-hydrostatics` | 2 → 4 | first-public-record; point; 1586–1586 |
| `early-stevin-statics` | 2 → 4 | first-public-record; point; 1586–1586 |
| `early-brahe-comet-distance` | 2 → 4 | observation; point; 1577–1577 |
| `early-gilbert-magnet` | 2 → 4 | first-public-record; point; 1600–1600 |
| `early-kepler-retinal-image` | 2 → 4 | first-public-record; point; 1604–1604 |
| `early-kepler-planetary-laws` | 4 → 8 | editorial-interval; uncertain-range; 1602–1609 |
| `early-galileo-star-messenger` | 2 → 8 | observation; point; 1610–1610 |
| `early-kepler-dioptrice` | 2 → 4 | first-public-record; point; 1611–1611 |
| `early-snell-triangulation` | 2 → 2 | first-public-record; point; 1617–1617 |
| `early-kepler-third-law` | 2 → 4 | achieved; point; 1618–1618 |
| `early-castelli-flow` | 2 → 2 | first-public-record; point; 1628–1628 |
| `early-mersenne-acoustics` | 2 → 2 | first-public-record; point; 1636–1636 |
| `early-descartes-refraction` | 2 → 2 | first-public-record; point; 1637–1637 |
| `early-galileo-two-sciences` | 4 → 8 | first-public-record; point; 1638–1638 |
| `early-torricelli-efflux` | 2 → 2 | first-public-record; point; 1644–1644 |
| `early-torricelli-vacuum` | 2 → 4 | first-public-record; point; 1644–1644 |
| `early-pascal-atmospheric-pressure` | 2 → 4 | first-public-record; point; 1648–1648 |
| `early-boyle-air-pump-experiments` | 2 → 2 | first-public-record; point; 1660–1660 |
| `early-boyle-pressure-volume` | 2 → 4 | first-public-record; point; 1662–1662 |
| `early-fermat-least-time` | 2 → 4 | first-public-record; point; 1662–1662 |
| `early-grimaldi-diffraction` | 2 → 4 | editorial-interval; uncertain-range; 1650–1663 |
| `early-newton-colour` | 4 → 4 | first-public-record; point; 1672–1672 |
| `early-huygens-pendulum-theory` | 2 → 4 | first-public-record; point; 1673–1673 |
| `early-romer-light-delay` | 2 → 4 | first-public-record; point; 1676–1676 |
| `early-hooke-elasticity` | 2 → 4 | first-public-record; point; 1678–1678 |
| `early-huygens-wave-optics` | 2 → 8 | first-public-record; point; 1678–1678 |
| `early-leibniz-calculus` | 2 → 4 | first-public-record; point; 1684–1684 |
| `early-newton-principia` | 8 → 16 | first-public-record; point; 1687–1687 |
| `early-papin-piston-steam` | 2 → 2 | first-public-record; point; 1690–1690 |
| `early-halley-comet-prediction` | 2 → 2 | first-public-record; point; 1705–1705 |
| `early-hauksbee-discharge` | 2 → 2 | first-public-record; point; 1709–1709 |
| `early-newcomen-engine` | 2 → 2 | first-public-record; point; 1712–1712 |
| `early-fahrenheit-scale` | 1 → 1 | first-public-record; point; 1724–1724 |
| `early-bradley-aberration` | 2 → 2 | first-public-record; point; 1729–1729 |
| `early-gray-conduction` | 2 → 2 | first-public-record; point; 1731–1731 |
| `early-dufay-two-electricities` | 2 → 2 | first-public-record; point; 1733–1733 |
| `early-euler-mechanica` | 2 → 4 | first-public-record; point; 1736–1736 |
| `early-bernoulli-hydrodynamica` | 2 → 4 | first-public-record; point; 1738–1738 |
| `early-bernoulli-kinetic-gases` | 2 → 4 | first-public-record; point; 1738–1738 |
| `early-chatelet-physics` | 1 → 1 | first-public-record; point; 1740–1740 |
| `early-celsius-scale` | 1 → 1 | first-public-record; point; 1742–1742 |
| `early-robins-ballistic-pendulum` | 2 → 2 | first-public-record; point; 1742–1742 |
| `early-clairaut-earth-figure` | 2 → 2 | first-public-record; point; 1743–1743 |
| `early-dalembert-principle` | 2 → 4 | first-public-record; point; 1743–1743 |
| `early-dalembert-wave-equation` | 2 → 4 | first-public-record; point; 1747–1747 |
| `early-franklin-electric-theory` | 2 → 4 | first-public-record; point; 1751–1751 |
| `early-euler-fluid-equations` | 4 → 4 | first-public-record; point; 1757–1757 |
| `early-boscovich-force-theory` | 2 → 2 | first-public-record; point; 1758–1758; excluded |
| `early-aepinus-electricity` | 2 → 2 | first-public-record; point; 1759–1759 |
| `early-lambert-photometry` | 2 → 4 | first-public-record; point; 1760–1760 |
| `early-black-latent-heat` | 2 → 4 | first-public-record; point; 1762–1762 |
| `early-euler-rigid-body` | 2 → 4 | first-public-record; point; 1765–1765 |
| `early-watt-separate-condenser` | 2 → 4 | first-public-record; point; 1769–1769 |
| `early-atwood-machine` | 1 → 1 | first-public-record; point; 1780–1780 |
| `early-lavoisier-laplace-calorimetry` | 2 → 4 | first-public-record; point; 1780–1780 |
| `early-herschel-uranus` | 2 → 2 | first-public-record; point; 1781–1781 |
| `early-carnot-machines` | 1 → 1 | first-public-record; point; 1783–1783 |
| `early-coulomb-law` | 2 → 8 | first-public-record; point; 1785–1785 |
| `early-caroline-herschel-comet` | 1 → 1 | first-public-record; point; 1786–1786 |
| `early-chladni-nodal-figures` | 2 → 2 | first-public-record; point; 1787–1787 |
| `early-lagrange-analytical-mechanics` | 4 → 8 | first-public-record; point; 1788–1788 |
| `early-galvani-animal-electricity` | 2 → 2 | first-public-record; point; 1789–1789 |
| `early-caroline-star-catalogue` | 1 → 1 | first-public-record; point; 1798–1798 |
| `early-cavendish-earth-density` | 2 → 4 | first-public-record; point; 1798–1798 |
| `early-rumford-friction-heat` | 2 → 4 | first-public-record; point; 1798–1798 |
| `early-herschel-infrared` | 2 → 4 | first-public-record; point; 1800–1800 |
| `early-volta-pile` | 4 → 8 | first-public-record; point; 1800–1800 |
| `early-archimedes-statics` | 2 → 4 | pending coordinated editorial interval |
| `early-aristarchus-heliocentrism` | 2 → 2 | pending coordinated editorial interval; excluded |
| `early-biruni-earth-measurement` | 2 → 2 | pending coordinated editorial interval |
| `early-buridan-impetus` | 1 → 1 | pending coordinated editorial interval; excluded |
| `early-farisi-rainbow` | 2 → 4 | pending coordinated editorial interval |
| `early-hero-pneumatics` | 1 → 1 | pending coordinated editorial interval |
| `early-hipparchus-precession` | 2 → 4 | pending coordinated editorial interval |
| `early-mohist-optics` | 2 → 2 | pending coordinated editorial interval |
| `early-oresme-motion-diagrams` | 2 → 2 | pending coordinated editorial interval |
| `early-theodoric-rainbow` | 2 → 4 | pending coordinated editorial interval |
| `ritter-ultraviolet` | 2 → 4 | first-public-record; point; 1801–1801 |
| `young-interference` | 4 → 8 | first-public-record; point; 1801–1801 |
| `dalton-atomic-theory` | 4 → 4 | first-public-record; point; 1803–1803 |
| `malus-polarization` | 2 → 4 | first-public-record; point; 1808–1808 |
| `gauss-observational-errors` | 2 → 2 | first-public-record; point; 1809–1809 |
| `avogadro-molecular-hypothesis` | 2 → 4 | first-public-record; point; 1811–1811 |
| `fraunhofer-spectral-lines` | 2 → 4 | observation; point; 1814–1814 |
| `dulong-petit-heat-capacity` | 2 → 2 | first-public-record; point; 1819–1819 |
| `oersted-electromagnetism` | 4 → 8 | first-public-record; point; 1820–1820 |
| `faraday-electromagnetic-rotation` | 2 → 2 | first-public-record; point; 1821–1821 |
| `seebeck-thermoelectricity` | 2 → 4 | first-public-record; point; 1821–1821 |
| `fourier-heat-theory` | 4 → 8 | first-public-record; point; 1822–1822 |
| `carnot-heat-engine` | 4 → 8 | first-public-record; point; 1824–1824 |
| `ohm-circuit-law` | 4 → 4 | first-public-record; point; 1827–1827 |
| `green-potential-theory` | 4 → 4 | first-public-record; point; 1828–1828 |
| `faraday-induction` | 4 → 8 | first-public-record; point; 1831–1831 |
| `clapeyron-heat-cycle` | 2 → 2 | first-public-record; point; 1834–1834 |
| `hamilton-dynamics` | 4 → 8 | first-public-record; point; 1834–1834 |
| `coriolis-relative-motion` | 2 → 2 | first-public-record; point; 1835–1835 |
| `doppler-frequency-shift` | 2 → 4 | first-public-record; point; 1842–1842 |
| `mayer-energy-equivalence` | 2 → 4 | first-public-record; point; 1842–1842 |
| `faraday-magneto-optics` | 2 → 4 | first-public-record; point; 1845–1845 |
| `stokes-viscous-flow` | 4 → 4 | first-public-record; point; 1845–1845 |
| `helmholtz-energy-conservation` | 8 → 8 | first-public-record; point; 1847–1847 |
| `kelvin-absolute-scale` | 2 → 4 | first-public-record; point; 1848–1848 |
| `clausius-heat-work` | 4 → 8 | first-public-record; point; 1850–1850 |
| `joule-heat-equivalent` | 2 → 4 | first-public-record; point; 1850–1850 |
| `foucault-pendulum` | 2 → 4 | first-public-record; point; 1851–1851 |
| `stokes-drag-law` | 2 → 2 | first-public-record; point; 1851–1851 |
| `foote-gas-heating` | 1 → 1 | first-public-record; point; 1856–1856 |
| `kirchhoff-spectral-analysis` | 4 → 4 | first-public-record; point; 1859–1859 |
| `maxwell-velocity-distribution` | 4 → 4 | first-public-record; point; 1860–1860 |
| `maxwell-electromagnetic-field` | 8 → 16 | first-public-record; point; 1864–1864 |
| `clausius-entropy` | 4 → 8 | first-public-record; point; 1865–1865 |
| `huggins-stellar-radial-velocity` | 2 → 2 | first-public-record; point; 1868–1868 |
| `rayleigh-scattering` | 2 → 2 | first-public-record; point; 1871–1871 |
| `boltzmann-transport-h-theorem` | 4 → 4 | first-public-record; point; 1872–1872 |
| `abbe-diffraction-resolution` | 2 → 4 | first-public-record; point; 1873–1873 |
| `van-der-waals-equation` | 4 → 4 | first-public-record; point; 1873–1873 |
| `gibbs-heterogeneous-equilibrium` | 4 → 8 | first-public-record; point; 1876–1876 |
| `boltzmann-statistical-entropy` | 4 → 8 | first-public-record; point; 1877–1877 |
| `hall-effect` | 2 → 2 | first-public-record; point; 1879–1879 |
| `stefan-radiation-law` | 2 → 2 | first-public-record; point; 1879–1879 |
| `curie-piezoelectricity` | 2 → 2 | first-public-record; point; 1880–1880 |
| `reynolds-flow-transition` | 2 → 2 | first-public-record; point; 1883–1883 |
| `boltzmann-radiation-derivation` | 2 → 2 | first-public-record; point; 1884–1884 |
| `poynting-energy-flow` | 2 → 4 | first-public-record; point; 1884–1884 |
| `balmer-hydrogen-spectrum` | 2 → 4 | first-public-record; point; 1885–1885 |
| `michelson-morley-experiment` | 4 → 4 | first-public-record; point; 1887–1887 |
| `hertz-electromagnetic-waves` | 4 → 8 | first-public-record; point; 1888–1888 |
| `pockels-surface-film-balance` | 2 → 2 | first-public-record; point; 1891–1891 |
| `rontgen-x-rays` | 4 → 8 | first-public-record; point; 1895–1895 |
| `becquerel-radioactivity` | 4 → 8 | first-public-record; point; 1896–1896 |
| `zeeman-splitting` | 2 → 4 | first-public-record; point; 1896–1896 |
| `thomson-electron` | 4 → 8 | first-public-record; point; 1897–1897 |
| `curies-polonium-radium` | 4 → 4 | first-public-record; point; 1898–1898 |
| `drude-electron-metals` | 2 → 2 | first-public-record; point; 1900–1900 |
| `planck-energy-quanta` | 8 → 8 | first-public-record; point; 1900–1900 |
| `gibbs-statistical-ensembles` | 4 → 4 | first-public-record; point; 1902–1902 |
| `rutherford-soddy-transmutation` | 4 → 4 | first-public-record; point; 1902–1902 |
| `prandtl-boundary-layer` | 4 → 4 | first-public-record; point; 1904–1904 |
| `einstein-brownian-motion` | 4 → 4 | first-public-record; point; 1905–1905 |
| `einstein-light-quanta` | 4 → 8 | first-public-record; point; 1905–1905 |
| `einstein-mass-energy` | 2 → 4 | first-public-record; point; 1905–1905 |
| `einstein-special-relativity` | 8 → 16 | first-public-record; point; 1905–1905 |
| `einstein-quantum-specific-heat` | 2 → 4 | first-public-record; point; 1907–1907 |
| `mie-spherical-scattering` | 2 → 2 | first-public-record; point; 1908–1908 |
| `onnes-liquid-helium` | 4 → 4 | first-public-record; point; 1908–1908 |
| `onnes-superconductivity` | 4 → 8 | first-public-record; point; 1911–1911 |
| `rutherford-nuclear-atom` | 4 → 8 | first-public-record; point; 1911–1911 |
| `wilson-cloud-tracks` | 4 → 4 | first-public-record; point; 1911–1911 |
| `debye-solid-heat` | 2 → 2 | first-public-record; point; 1912–1912 |
| `hess-cosmic-radiation` | 4 → 4 | first-public-record; point; 1912–1912 |
| `laue-crystal-diffraction` | 4 → 4 | first-public-record; point; 1912–1912 |
| `leavitt-period-luminosity` | 4 → 4 | first-public-record; point; 1912–1912 |
| `bohr-quantized-atom` | 4 → 8 | first-public-record; point; 1913–1913 |
| `millikan-precision-charge` | 2 → 4 | first-public-record; point; 1913–1913 |
| `franck-hertz-excitation` | 2 → 4 | first-public-record; point; 1914–1914 |
| `einstein-general-relativity` | 8 → 16 | first-public-record; point; 1915–1915 |
| `einstein-stimulated-emission` | 4 → 4 | first-public-record; point; 1916–1916 |
| `schwarzschild-spherical-solution` | 2 → 4 | first-public-record; point; 1916–1916 |
| `noether-symmetry-conservation` | 4 → 8 | first-public-record; point; 1918–1918 |
| `rutherford-artificial-transmutation` | 4 → 4 | first-public-record; point; 1919–1919 |
| `saha-thermal-ionization` | 4 → 4 | first-public-record; point; 1920–1920 |
| `friedmann-dynamic-cosmology` | 4 → 4 | first-public-record; point; 1922–1922 |
| `stern-gerlach-space-quantization` | 4 → 4 | first-public-record; point; 1922–1922 |
| `compton-xray-scattering` | 4 → 4 | first-public-record; point; 1923–1923 |
| `de-broglie-matter-waves` | 4 → 4 | first-public-record; point; 1923–1923 |
| `bose-einstein-statistics` | 4 → 8 | first-public-record; point; 1924–1924 |
| `matrix-quantum-mechanics` | 8 → 16 | first-public-record; point; 1925–1925 |
| `pauli-exclusion` | 4 → 8 | first-public-record; point; 1925–1925 |
| `payne-stellar-composition` | 4 → 4 | first-public-record; point; 1925–1925 |
| `born-probability-interpretation` | 4 → 8 | first-public-record; point; 1926–1926 |
| `fermi-dirac-statistics` | 4 → 8 | first-public-record; point; 1926–1926 |
| `schrodinger-wave-mechanics` | 8 → 8 | first-public-record; point; 1926–1926 |
| `davisson-germer-diffraction` | 4 → 4 | first-public-record; point; 1927–1927 |
| `heisenberg-uncertainty` | 4 → 8 | first-public-record; point; 1927–1927 |
| `lemaitre-expanding-universe` | 4 → 4 | first-public-record; point; 1927–1927 |
| `dirac-relativistic-electron` | 4 → 8 | first-public-record; point; 1928–1928 |
| `raman-inelastic-light-scattering` | 4 → 4 | first-public-record; point; 1928–1928 |
| `hubble-distance-redshift` | 4 → 8 | first-public-record; point; 1929–1929 |
| `pauli-neutrino-hypothesis` | 2 → 4 | first-public-record; point; 1930–1930 |
| `chandrasekhar-white-dwarf-limit` | 2 → 4 | first-public-record; point; 1931–1931 |
| `cyclotron-first-demonstration` | 2 → 4 | first-public-record; point; 1931–1931 |
| `electron-microscope` | 2 → 4 | first-public-record; point; 1931–1931 |
| `onsager-reciprocity` | 2 → 4 | first-public-record; point; 1931–1931 |
| `accelerator-nuclear-transmutation` | 2 → 4 | first-public-record; point; 1932–1932 |
| `neutron-discovery` | 4 → 8 | first-public-record; point; 1932–1932 |
| `positron-discovery` | 4 → 8 | first-public-record; point; 1932–1932 |
| `coma-dark-matter` | 2 → 4 | first-public-record; point; 1933–1933 |
| `galactic-radio-emission` | 2 → 4 | observation; point; 1932–1932 |
| `meissner-effect` | 2 → 4 | first-public-record; point; 1933–1933 |
| `artificial-radioactivity` | 2 → 4 | first-public-record; point; 1934–1934 |
| `cherenkov-radiation` | 2 → 2 | first-public-record; point; 1934–1934 |
| `fermi-beta-decay-theory` | 4 → 4 | first-public-record; point; 1934–1934 |
| `slow-neutron-activation` | 2 → 2 | first-public-record; point; 1934–1934 |
| `epr-entanglement` | 2 → 2 | first-public-record; point; 1935–1935 |
| `yukawa-meson-theory` | 2 → 4 | first-public-record; point; 1935–1935 |
| `muon-discovery` | 2 → 4 | first-public-record; point; 1937–1937 |
| `helium-four-superfluidity` | 4 → 8 | first-public-record; point; 1938–1938 |
| `molecular-beam-magnetic-resonance` | 2 → 4 | first-public-record; point; 1938–1938 |
| `nuclear-fission` | 4 → 8 | achieved; sustained; 1938–1939 |
| `gravitational-collapse-model` | 2 → 4 | first-public-record; point; 1939–1939 |
| `stellar-energy-fusion` | 2 → 4 | first-public-record; point; 1939–1939 |
| `kolmogorov-turbulence-scaling` | 2 → 4 | first-public-record; point; 1941–1941 |
| `alfven-waves` | 2 → 4 | first-public-record; point; 1942–1942 |
| `controlled-nuclear-chain-reaction` | 2 → 4 | first-public-record; point; 1942–1942 |
| `onsager-exact-ising-solution` | 2 → 4 | first-public-record; point; 1944–1944 |
| `bulk-nuclear-magnetic-resonance` | 4 → 4 | first-public-record; point; 1946–1946 |
| `renormalized-qed` | 8 → 8 | achieved; sustained; 1946–1949 |
| `electron-anomalous-moment` | 2 → 4 | first-public-record; point; 1947–1947 |
| `lamb-shift` | 2 → 4 | first-public-record; point; 1947–1947 |
| `pion-discovery` | 2 → 4 | first-public-record; point; 1947–1947 |
| `point-contact-transistor` | 4 → 8 | first-public-record; point; 1947–1947 |
| `casimir-vacuum-force` | 2 → 4 | first-public-record; point; 1948–1948 |
| `holography-principle` | 2 → 4 | first-public-record; point; 1948–1948 |
| `relic-radiation-prediction` | 2 → 2 | first-public-record; point; 1948–1948 |
| `nuclear-shell-model` | 4 → 4 | first-public-record; point; 1949–1949 |
| `ginzburg-landau-theory` | 2 → 4 | first-public-record; point; 1950–1950 |
| `spin-echo` | 2 → 4 | first-public-record; point; 1950–1950 |
| `bubble-chamber` | 2 → 2 | first-public-record; point; 1952–1952 |
| `metropolis-sampling` | 2 → 4 | first-public-record; point; 1953–1953 |
| `maser` | 2 → 4 | first-public-record; point; 1954–1954 |
| `yang-mills-gauge-theory` | 8 → 8 | first-public-record; point; 1954–1954 |
| `antiproton-discovery` | 2 → 4 | first-public-record; point; 1955–1955 |
| `free-neutrino-detection` | 2 → 4 | first-public-record; point; 1956–1956 |
| `weak-parity-violation` | 4 → 8 | achieved; point; 1956–1956 |
| `abrikosov-vortex-lattice` | 2 → 4 | first-public-record; point; 1957–1957 |
| `bcs-superconductivity` | 4 → 8 | first-public-record; point; 1957–1957 |
| `stellar-nucleosynthesis-synthesis` | 2 → 4 | first-public-record; point; 1957–1957 |
| `anderson-localization` | 2 → 4 | first-public-record; point; 1958–1958 |
| `mossbauer-effect` | 2 → 4 | first-public-record; point; 1958–1958 |
| `semiconductor-tunnel-diode` | 2 → 2 | first-public-record; point; 1958–1958 |
| `aharonov-bohm-effect` | 2 → 4 | first-public-record; point; 1959–1959 |
| `ruby-laser` | 4 → 4 | first-public-record; point; 1960–1960 |
| `landauer-erasure-bound` | 2 → 4 | first-public-record; point; 1961–1961 |
| `josephson-effect` | 2 → 4 | first-public-record; point; 1962–1962 |
| `muon-neutrino-discovery` | 2 → 4 | first-public-record; point; 1962–1962 |
| `hubbard-correlated-electrons` | 2 → 4 | first-public-record; point; 1963–1963 |
| `kerr-black-hole` | 2 → 4 | first-public-record; point; 1963–1963 |
| `lorenz-deterministic-chaos` | 2 → 4 | first-public-record; point; 1963–1963 |
| `quantum-optical-coherence` | 2 → 4 | first-public-record; point; 1963–1963 |
| `quasar-redshift` | 2 → 4 | first-public-record; point; 1963–1963 |
| `bell-theorem` | 4 → 4 | first-public-record; point; 1964–1964 |
| `cp-violation-kaons` | 4 → 4 | first-public-record; point; 1964–1964 |
| `density-functional-theory` | 4 → 8 | achieved; sustained; 1964–1965 |
| `higgs-mechanism` | 4 → 8 | achieved; point; 1964–1964 |
| `quark-model` | 4 → 8 | first-public-record; point; 1964–1964 |
| `cosmic-microwave-background` | 4 → 8 | first-public-record; point; 1965–1965 |
| `penrose-singularity-theorem` | 2 → 4 | first-public-record; point; 1965–1965 |
| `low-loss-fibre-proposal` | 2 → 4 | first-public-record; point; 1966–1966 |
| `electroweak-unification` | 8 → 8 | first-public-record; point; 1967–1967 |
| `pulsar-discovery` | 2 → 4 | first-public-record; point; 1967–1967 |
| `radiative-convective-climate-model` | 2 → 4 | first-public-record; point; 1967–1967 |
| `deep-inelastic-scattering` | 4 → 4 | first-public-record; point; 1968–1968 |
| `multiwire-proportional-chamber` | 2 → 4 | first-public-record; point; 1968–1968 |
| `solar-neutrino-problem` | 2 → 4 | first-public-record; point; 1968–1968 |
| `charge-coupled-device` | 2 → 4 | first-public-record; point; 1969–1969 |
| `bkt-transition` | 4 → 4 | achieved; sustained; 1970–1973 |
| `gim-mechanism` | 2 → 4 | first-public-record; point; 1970–1970 |
| `gauge-theory-renormalizability` | 2 → 4 | first-public-record; point; 1971–1971 |
| `wilson-renormalization-group` | 4 → 8 | first-public-record; point; 1971–1971 |
| `bell-inequality-experiments` | 4 → 4 | achieved; sustained; 1972–1982 |
| `helium-three-superfluidity` | 2 → 4 | first-public-record; point; 1972–1972 |
| `black-hole-entropy` | 2 → 4 | first-public-record; point; 1973–1973 |
| `kobayashi-maskawa-cp-model` | 2 → 4 | first-public-record; point; 1973–1973 |
| `magnetic-resonance-imaging` | 2 → 4 | first-public-record; point; 1973–1973 |
| `qcd-asymptotic-freedom` | 8 → 8 | first-public-record; point; 1973–1973 |
| `weak-neutral-currents` | 2 → 4 | first-public-record; point; 1973–1973 |
| `binary-pulsar-discovery` | 2 → 4 | first-public-record; point; 1974–1974 |
| `hawking-radiation` | 4 → 4 | first-public-record; point; 1974–1974 |
| `jpsi-charmonium-discovery` | 4 → 8 | first-public-record; point; 1974–1974 |
| `tau-lepton-discovery` | 2 → 4 | first-public-record; point; 1975–1975 |
| `bottom-quark-discovery` | 2 → 4 | first-public-record; point; 1977–1977 |
| `laser-cooling-trapped-ions` | 2 → 4 | first-public-record; point; 1978–1978 |
| `gluon-three-jet-evidence` | 2 → 4 | first-public-record; point; 1979–1979 |
| `parisi-spin-glass-order` | 2 → 4 | first-public-record; point; 1979–1979 |
| `cosmic-inflation` | 4 → 4 | achieved; sustained; 1980–1982 |
| `integer-quantum-hall-effect` | 4 → 8 | first-public-record; point; 1980–1980 |
| `scanning-tunnelling-microscope` | 2 → 4 | first-public-record; point; 1981–1981 |
| `fractional-quantum-hall-effect` | 4 → 8 | first-public-record; point; 1982–1982 |
| `w-z-boson-discovery` | 4 → 4 | first-public-record; point; 1983–1983 |
| `bb84-quantum-key-distribution` | 2 → 4 | first-public-record; point; 1984–1984 |
| `berry-geometric-phase` | 2 → 4 | first-public-record; point; 1984–1984 |
| `chirped-pulse-amplification` | 2 → 4 | first-public-record; point; 1985–1985 |
| `macroscopic-quantum-circuit` | 2 → 4 | first-public-record; point; 1985–1985 |
| `optical-molasses-neutral-atoms` | 2 → 4 | first-public-record; point; 1985–1985 |
| `universal-quantum-computer` | 2 → 4 | first-public-record; point; 1985–1985 |
| `atomic-force-microscope` | 2 → 4 | first-public-record; point; 1986–1986 |
| `cuprate-high-temperature-superconductivity` | 4 → 8 | first-public-record; point; 1986–1986 |
| `supernova-neutrinos` | 2 → 4 | first-public-record; point; 1987–1987 |
| `giant-magnetoresistance` | 2 → 4 | first-public-record; point; 1988–1988 |
| `efficient-blue-led` | 2 → 4 | achieved; sustained; 1989–1993 |
| `cobe-blackbody-spectrum` | 2 → 4 | first-public-record; point; 1990–1990 |
| `cobe-cmb-anisotropies` | 4 → 4 | first-public-record; point; 1992–1992 |
| `quantum-teleportation-protocol` | 2 → 4 | first-public-record; point; 1993–1993 |
| `shor-algorithm` | 2 → 4 | first-public-record; point; 1994–1994 |
| `dilute-gas-bose-einstein-condensation` | 4 → 8 | first-public-record; point; 1995–1995 |
| `exoplanet-solar-type-star` | 2 → 4 | first-public-record; point; 1995–1995 |
| `quantum-error-correction` | 2 → 4 | first-public-record; point; 1995–1995 |
| `top-quark-discovery` | 2 → 4 | first-public-record; point; 1995–1995 |
| `trapped-ion-quantum-gate` | 2 → 4 | first-public-record; point; 1995–1995 |
| `ads-cft-correspondence` | 4 → 4 | first-public-record; point; 1997–1997 |
| `experimental-quantum-teleportation` | 2 → 4 | first-public-record; point; 1997–1997 |
| `accelerating-universe` | 4 → 8 | first-public-record; point; 1998–1998 |
| `neutrino-flavour-oscillations` | 4 → 8 | achieved; sustained; 1998–2002 |
| `slow-light-ultracold-gas` | 1 → 1 | first-public-record; point; 1999–1999 |
| `tau-neutrino-discovery` | 1 → 1 | first-public-record; point; 2000–2000 |
| `attosecond-light-pulses` | 2 → 4 | first-public-record; point; 2001–2001 |
| `ultracold-mott-transition` | 2 → 4 | first-public-record; point; 2002–2002 |
| `fermionic-pair-condensation` | 2 → 4 | first-public-record; point; 2004–2004 |
| `graphene-isolation` | 4 → 4 | first-public-record; point; 2004–2004 |
| `numerical-black-hole-merger` | 2 → 4 | first-public-record; point; 2005–2005 |
| `strongly-coupled-quark-gluon-plasma` | 2 → 4 | first-public-record; point; 2005–2005 |
| `quantum-spin-hall-insulator` | 2 → 4 | first-public-record; point; 2007–2007 |
| `higgs-boson-discovery` | 4 → 8 | observation; point; 2012–2012 |
| `icecube-astrophysical-neutrinos` | 2 → 4 | first-public-record; point; 2013–2013 |
| `loophole-free-bell-tests` | 2 → 4 | first-public-record; point; 2015–2015 |
| `weyl-semimetal-discovery` | 2 → 4 | first-public-record; point; 2015–2015 |
| `direct-gravitational-wave-detection` | 4 → 8 | observation; point; 2015–2015 |
| `binary-neutron-star-multimessenger` | 2 → 4 | first-public-record; point; 2017–2017 |
| `magic-angle-twisted-graphene` | 2 → 4 | first-public-record; point; 2018–2018 |
| `event-horizon-telescope-m87` | 4 → 4 | first-public-record; point; 2019–2019 |
| `solar-cno-neutrinos` | 1 → 1 | first-public-record; point; 2020–2020 |
| `fusion-target-ignition` | 2 → 4 | first-public-record; point; 2022–2022 |
| `nanohertz-gravitational-wave-evidence` | 2 → 4 | first-public-record; point; 2023–2023 |
| `below-threshold-quantum-error-correction` | 1 → 1 | first-public-record; point; 2024–2024 |
| `baryon-cp-violation` | 1 → 1 | first-public-record; point; 2025–2025 |
| `journal-electron-spin` | 4 → 8 | first-public-record; point; 1925–1925 |
| `journal-quantum-ferromagnetism` | 4 → 4 | first-public-record; point; 1928–1928 |
| `journal-deuterium` | 2 → 2 | first-public-record; point; 1932–1932 |
| `journal-fission-liquid-drop` | 2 → 2 | first-public-record; point; 1939–1939 |
| `journal-neutrino-helicity` | 2 → 4 | first-public-record; point; 1958–1958 |
| `journal-hubbard-auxiliary-field` | 2 → 2 | first-public-record; point; 1959–1959 |
| `journal-neutron-phonon-spectra` | 2 → 4 | first-public-record; point; 1959–1959 |
| `journal-nambu-spontaneous-symmetry-breaking` | 4 → 8 | first-public-record; point; 1960–1960 |
| `journal-pound-rebka-redshift` | 2 → 4 | first-public-record; point; 1960–1960 |
| `journal-eightfold-way` | 4 → 4 | first-public-record; point; 1961–1961 |
| `journal-optical-second-harmonic` | 2 → 4 | first-public-record; point; 1961–1961 |
| `journal-extrasolar-xrays` | 4 → 4 | first-public-record; point; 1962–1962 |
| `journal-cabibbo-mixing` | 2 → 4 | first-public-record; point; 1963–1963 |
| `journal-kondo-resistance` | 2 → 4 | first-public-record; point; 1964–1964 |
| `journal-soliton-recurrence` | 2 → 2 | first-public-record; point; 1965–1965 |
| `journal-mermin-wagner` | 2 → 4 | first-public-record; point; 1966–1966 |
| `journal-veneziano-amplitude` | 2 → 2 | first-public-record; point; 1968–1968 |
| `journal-environment-decoherence` | 2 → 2 | first-public-record; point; 1970–1970 |
| `journal-helium-three-pairing-theory` | 2 → 4 | first-public-record; point; 1972–1972 |
| `journal-wess-zumino-supersymmetry` | 2 → 2 | first-public-record; point; 1974–1974 |
| `journal-supergravity` | 2 → 2 | first-public-record; point; 1976–1976 |
| `journal-altarelli-parisi-evolution` | 2 → 4 | first-public-record; point; 1977–1977 |
| `journal-hexatic-melting` | 2 → 2 | first-public-record; point; 1978–1978 |
| `journal-pointer-basis` | 2 → 2 | first-public-record; point; 1981–1981 |
| `journal-tknn-topological-conductance` | 4 → 8 | first-public-record; point; 1982–1982 |
| `journal-haldane-spin-chain` | 4 → 4 | first-public-record; point; 1983–1983 |
| `journal-laughlin-fractional-fluid` | 4 → 8 | first-public-record; point; 1983–1983 |
| `journal-lattice-gas-fluids` | 2 → 2 | first-public-record; point; 1986–1986 |
| `journal-optical-tweezers` | 2 → 4 | first-public-record; point; 1986–1986 |
| `journal-single-ion-quantum-jumps` | 2 → 4 | first-public-record; point; 1986–1986 |
| `journal-haldane-chern-insulator` | 4 → 4 | first-public-record; point; 1988–1988 |
| `journal-control-chaos` | 2 → 2 | first-public-record; point; 1990–1990 |
| `journal-synchronize-chaos` | 2 → 2 | first-public-record; point; 1990–1990 |
| `journal-ekert-entanglement-cryptography` | 2 → 2 | first-public-record; point; 1991–1991 |
| `journal-dmrg` | 2 → 4 | first-public-record; point; 1992–1992 |
| `journal-light-orbital-angular-momentum` | 2 → 2 | first-public-record; point; 1992–1992 |
| `journal-strong-field-harmonic-theory` | 2 → 2 | first-public-record; point; 1994–1994 |
| `journal-cavity-field-decoherence` | 2 → 2 | first-public-record; point; 1996–1996 |
| `journal-spin-magnetization-tunnelling` | 2 → 2 | first-public-record; point; 1996–1996 |
| `journal-jarzynski-equality` | 2 → 4 | first-public-record; point; 1997–1997 |
| `journal-warped-extra-dimension` | 2 → 2 | first-public-record; point; 1999–1999 |
| `journal-negative-index-medium` | 2 → 4 | first-public-record; point; 2000–2000 |
| `journal-optical-frequency-comb` | 4 → 4 | first-public-record; point; 2000–2000 |
| `journal-perfect-lens-proposal` | 2 → 2 | first-public-record; point; 2000–2000 |
| `journal-arbitrary-degree-random-graphs` | 2 → 2 | first-public-record; point; 2001–2001 |
| `journal-entanglement-negativity` | 1 → 1 | first-public-record; point; 2002–2002 |
| `journal-element-118-confirmation` | 1 → 1 | first-public-record; point; 2006–2006 |
| `journal-three-dimensional-topological-insulator` | 2 → 4 | first-public-record; point; 2007–2007 |

## Posthumous-publication boundary check

A programmatic comparison of the 391 original-plus-Tycho event date models against all linked archived death years found Grimaldi as the sole date model wholly after a linked contributor’s death. Its 1665 posthumous publication is now separate metadata, while the substantive result uses a clearly labelled 1650–1663 editorial formation interval. The University of Bologna museum explicitly states that the work was published after the author’s death; the interval is an estimate, not a documented sequence of annual observations. The current 300 new editorial records also passed year/range, future-date and lifespan-boundary checks.

- [University of Bologna Museum — Grimaldi and diffraction](https://sma.unibo.it/it/qr-code/righi-e-linsegnamento-della-fisica/esperimento-grimaldi)
- [University of Bologna — Grimaldi](https://www.scienzagiovane.unibo.it/English/scientists/grimaldi-1.html)

## Copernican early proposal versus the 1543 complete treatise

The same eight-point event is now explicitly the **early proposal of the moving-Earth heliocentric planetary system**, rather than the first printed edition as an event in publishing history. This event definition follows the requested actual-result chronology: Commentariolus already contained the reordered planetary scheme before De revolutionibus appeared. There is no second eight-point score for the later complete work.

Owen Gingerich’s IAU historical review (Harvard–Smithsonian, published by Cambridge) explains that the anonymous draft existed by the 1514 private-library inventory of Matthew of Miechów. The University of São Paulo bibliographic description of an annotated translation of the primary text places its composition around 1510. The resulting conservative 1502–1514 allocation is a practical **editorial dating estimate**, not securely attested work in each of those years or a source confidence interval; approximately 1510 is a common estimate, not a securely known lower bound. `dateConfidence` remains estimated; the documented circulation upper bound and 1543 complete-treatise publication are separate metadata.

Dating remains disputed. The University of Bristol historical analysis distinguishes the traditional broad documentary limits (after 1502 and by May 1514) from the contextual reconstruction around 1510. More recent stylometric research has argued for still earlier composition (including a summer-1503 hypothesis); this is an alternative historical reconstruction accommodated by the conservative 1502–1514 interval, not adopted as an exact date here. A future historiographical update can widen or move this event’s dating distribution without adding a duplicate theory event. Retaining 1543 would be appropriate only if the event were defined narrowly as the complete published mathematical treatise; it would then fail to represent the substantially earlier proposal requested for this index.

- [Gingerich, The Astronomy and Cosmology of Copernicus](https://resolve.cambridge.org/core/services/aop-cambridge-core/content/view/92CFF685FEA0F86E3AF3DA1415D2195D/S1539299600001830a.pdf/astronomy_and_cosmology_of_copernicus.pdf)
- [University of São Paulo, annotated Commentariolus translation](https://www.ghtc.usp.br/ram-r37.htm)
- [University of Bristol, Copernicus’s Development in Context](https://research-information.bris.ac.uk/files/52397418/Copernicus_s_development_in_context_v20.pdf)
- [Borski and Kokowski, 2025 stylometric dating hypothesis](https://academic.oup.com/dsh/article/40/1/15/7933816)
