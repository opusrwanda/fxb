import type { Metadata } from "next";
import { Container } from "@/components/layout/container";
import { PageHeader } from "@/components/layout/page-header";
import { SectionNav } from "@/components/layout/section-nav";
import { PartnerLogos } from "@/components/sections/get-involved/partner-logos";
import { Pill } from "@/components/ui/pill";
import { Reveal } from "@/components/ui/reveal";
import { org } from "@/lib/site";

export const metadata: Metadata = {
  title: "Partner With Us",
  description:
    "Development partners, government collaboration, institutional donors and corporate partnerships — and how to start a conversation with FXB Rwanda.",
};

/**
 * Partner With FXB Rwanda.
 *
 * Five blocks, in the brief's order: development partners, government,
 * institutional donors, corporate partnerships, and how to become one. Each
 * carries its own anchor so the section can be linked into directly.
 *
 * The logo walls are real: `partners.ts` holds 34 marks already sorted into the
 * same four categories the brief names, so each block shows its own set rather
 * than repeating one undifferentiated wall.
 */

const collaborationAreas = [
  "Child protection and family strengthening",
  "Education",
  "Health and nutrition",
  "HIV prevention and care",
  "Economic empowerment",
  "Agriculture and food security",
  "Climate resilience",
  "Water, sanitation and hygiene",
  "Emergency response",
];

const whyPartner = [
  "More than 30 years of experience working in Rwanda",
  "Strong relationships with communities and local authorities",
  "Experience implementing multi-sector programmes",
  "Robust monitoring, evaluation, accountability and learning systems",
  "Transparent financial and programme management",
  "A skilled team with expertise across multiple development areas",
];

const governmentEngagement = [
  {
    title: "Policy Alignment",
    body: "Ensuring programmes support national strategies and development frameworks.",
  },
  {
    title: "Community Coordination",
    body: "Working with districts, sectors, cells and local leaders to effectively reach vulnerable households.",
  },
  {
    title: "Capacity Strengthening",
    body: "Supporting government institutions and community structures through training, tools and technical support.",
  },
  {
    title: "Knowledge Sharing",
    body: "Generating evidence and lessons learned that contribute to improved services and decision-making.",
  },
];

const donorCommitments = [
  "Transparency and accountability",
  "Effective programme management",
  "Evidence-based interventions",
  "Strong monitoring and reporting systems",
  "Responsible use of resources",
];

const corporateRoutes = [
  {
    title: "Corporate Social Responsibility",
    body: "Support programmes that create measurable social impact.",
  },
  {
    title: "Employee Engagement",
    body: "Mobilise employees through volunteering, fundraising or skills-sharing initiatives.",
  },
  {
    title: "In-Kind Support",
    body: "Provide products, services or expertise that strengthen our programmes.",
  },
  {
    title: "Strategic Partnerships",
    body: "Develop innovative solutions together with FXB Rwanda.",
  },
];

const partnershipOpportunities = [
  {
    title: "Programme Support",
    body: "Fund or support initiatives aligned with your mission.",
  },
  {
    title: "Technical Collaboration",
    body: "Share expertise, research, innovation or capacity-building support.",
  },
  {
    title: "Financial Partnership",
    body: "Invest in programmes that create measurable impact.",
  },
  {
    title: "Advocacy and Awareness",
    body: "Help amplify the voices and needs of vulnerable communities.",
  },
];

/** A checklist, set as a two-column list of green-bulleted lines. */
function Checklist({ items }: { items: string[] }) {
  return (
    <ul className="grid gap-x-8 gap-y-3.5 sm:grid-cols-2">
      {items.map((item) => (
        <li key={item} className="flex gap-3.5">
          <span
            className="mt-2 size-1.5 shrink-0 rounded-full bg-green"
            aria-hidden="true"
          />
          <span className="text-base leading-snug text-gray">{item}</span>
        </li>
      ))}
    </ul>
  );
}

/** A titled block, used for the government, corporate and partnership grids. */
function Cards({
  items,
  dark = false,
}: {
  items: { title: string; body: string }[];
  dark?: boolean;
}) {
  return (
    <ul className="grid gap-6 sm:grid-cols-2">
      {items.map((item, index) => (
        <Reveal
          as="li"
          key={item.title}
          delay={Math.min(index, 3) * 60}
          className={`wedge p-7 ${dark ? "bg-white-12" : "bg-blue-08"}`}
        >
          <h4
            className={`text-lg font-semibold tracking-[-0.02em] ${
              dark ? "text-white" : "text-blue"
            }`}
          >
            {item.title}
          </h4>
          <p
            className={`mt-2 text-[15px] leading-relaxed ${
              dark ? "text-white-94" : "text-gray"
            }`}
          >
            {item.body}
          </p>
        </Reveal>
      ))}
    </ul>
  );
}

function SectionHeading({
  eyebrow,
  title,
  dark = false,
}: {
  eyebrow: string;
  title: string;
  dark?: boolean;
}) {
  return (
    <Reveal className="flex flex-col gap-5">
      <div className="flex items-center gap-4">
        <span
          className={`h-px w-10 ${dark ? "bg-white-40" : "bg-green"}`}
          aria-hidden="true"
        />
        <span
          className={`text-xs font-semibold tracking-[0.14em] ${
            dark ? "text-white-94" : "text-gray-80"
          }`}
        >
          {eyebrow}
        </span>
      </div>
      <h2
        className={`max-w-[24ch] text-3xl font-bold tracking-[-0.03em] lg:text-[40px] lg:leading-[1.1] ${
          dark ? "text-white" : "text-blue"
        }`}
      >
        {title}
      </h2>
    </Reveal>
  );
}

export default function PartnersPage() {
  return (
    <>
      <PageHeader
        breadcrumbs={[{ label: "Get Involved", href: "/get-involved" }]}
        eyebrow="PARTNER WITH US"
        title="Together, we can create lasting change"
        intro="At FXB Rwanda, we believe that meaningful and lasting impact is achieved when communities, governments, donors, institutions, businesses and development organisations work together toward a shared vision."
      />

      {/* Five kinds of partner, five sections, and the page runs long enough
          that reaching the last of them meant scrolling past the other four.
          Every section already carried an anchor — `#become-a-partner` is
          linked from Get Involved and from the programme pages — so this is
          navigation over ids that already existed rather than new structure. */}
      <SectionNav
        sections={[
          { id: "development-partners", label: "Development Partners" },
          { id: "government", label: "Government" },
          { id: "donors", label: "Institutional Donors" },
          { id: "corporate", label: "Corporate" },
          { id: "become-a-partner", label: "Become a Partner" },
        ]}
      />

      {/* Development partners.

          Top padding, unlike the four sections below it, which carry `py`.
          This one used to sit straight under the page header and took its
          space from the header's own bottom padding; the tab bar now sits
          between them and ends on a hairline, so without this the first
          section began hard against that line. */}
      <section
        id="development-partners"
        className="scroll-mt-36 bg-white pt-14 pb-24 lg:pt-16 lg:pb-32"
      >
        <Container>
          <SectionHeading
            eyebrow="DEVELOPMENT PARTNERS"
            title="Working together for greater impact"
          />

          <div className="mt-10 grid gap-10 lg:grid-cols-2 lg:gap-16">
            <Reveal delay={80} className="flex flex-col gap-6">
              <p className="text-base leading-relaxed text-gray lg:text-[17px]">
                Development partnerships are at the heart of FXB Rwanda&rsquo;s
                mission. We collaborate with international NGOs, UN agencies,
                foundations and development organisations to design and
                implement programmes that address complex challenges affecting
                vulnerable communities.
              </p>
              <p className="text-base leading-relaxed text-gray lg:text-[17px]">
                Through these partnerships, FXB Rwanda contributes its deep
                community knowledge, local networks, technical expertise and
                implementation capacity to transform resources into meaningful
                impact.
              </p>
            </Reveal>

            <Reveal delay={160}>
              <p className="text-xs font-semibold tracking-[0.14em] text-gray-80">
                WHY PARTNER WITH FXB RWANDA?
              </p>
              <div className="mt-6">
                <Checklist items={whyPartner} />
              </div>
            </Reveal>
          </div>

          <Reveal delay={200} className="mt-14">
            <p className="text-xs font-semibold tracking-[0.14em] text-gray-80">
              AREAS OF COLLABORATION
            </p>
          </Reveal>
          <Reveal delay={240} className="mt-6">
            <Checklist items={collaborationAreas} />
          </Reveal>

          <Reveal delay={280} className="mt-14">
            <p className="text-xs font-semibold tracking-[0.14em] text-gray-80">
              OUR DEVELOPMENT PARTNERS
            </p>
          </Reveal>
          <div className="mt-6">
            <PartnerLogos category="development" />
          </div>
        </Container>
      </section>

      {/* Government */}
      <section
        id="government"
        className="scroll-mt-36 bg-blue py-24 lg:py-32"
      >
        <Container>
          <SectionHeading
            eyebrow="GOVERNMENT COLLABORATION"
            title="Working alongside government to strengthen communities"
            dark
          />

          <Reveal delay={80} className="mt-10 flex flex-col gap-6">
            <p className="max-w-[58ch] text-base leading-relaxed text-white-94 lg:text-[17px]">
              FXB Rwanda recognises government leadership as essential for
              sustainable development. With the Ministry of Gender and Family
              Promotion (MIGEPROF) as the line ministry, we work closely with
              national and local government institutions to align our programmes
              with Rwanda&rsquo;s development priorities and contribute to
              national goals.
            </p>
            <p className="max-w-[58ch] text-base leading-relaxed text-white-94 lg:text-[17px]">
              Our collaboration with government ensures that interventions
              respond to community needs, complement existing systems, and
              contribute to long-term sustainability.
            </p>
          </Reveal>

          <div className="mt-12">
            <Cards items={governmentEngagement} dark />
          </div>

          <Reveal delay={200} className="mt-14">
            <p className="text-xs font-semibold tracking-[0.14em] text-white-94">
              WORKING TOGETHER FOR SUSTAINABLE SOLUTIONS
            </p>
          </Reveal>
          {/* The logo tiles carry their own white ground, so the wall reads the
              same way in a colour room as it does on white. */}
          <div className="mt-6 rounded-card bg-white p-6 lg:p-8">
            <PartnerLogos category="government" />
          </div>
        </Container>
      </section>

      {/* Institutional donors */}
      <section id="donors" className="scroll-mt-36 bg-white py-24 lg:py-32">
        <Container>
          <SectionHeading
            eyebrow="INSTITUTIONAL DONORS"
            title="Investing in solutions that transform lives"
          />

          <div className="mt-10 grid gap-10 lg:grid-cols-2 lg:gap-16">
            <Reveal delay={80} className="flex flex-col gap-6">
              <p className="text-base leading-relaxed text-gray lg:text-[17px]">
                Institutional donors play a vital role in enabling FXB Rwanda to
                deliver high-quality programmes that improve the lives of
                vulnerable children and families. With donor support, we
                transform evidence-based ideas into practical solutions that
                reach communities most in need.
              </p>
              <div>
                <p className="text-xs font-semibold tracking-[0.14em] text-gray-80">
                  YOUR INVESTMENT CONTRIBUTES TO
                </p>
                <ul className="mt-5 flex flex-col gap-3">
                  {[
                    "Improving children's access to education and protection",
                    "Strengthening family resilience",
                    "Increasing access to healthcare and nutrition",
                    "Creating sustainable livelihoods",
                    "Building climate-resilient communities",
                  ].map((item) => (
                    <li key={item} className="flex gap-3.5">
                      <span
                        className="mt-2 size-1.5 shrink-0 rounded-full bg-green"
                        aria-hidden="true"
                      />
                      <span className="text-base leading-snug text-gray">
                        {item}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </Reveal>

            <Reveal delay={160}>
              <p className="text-xs font-semibold tracking-[0.14em] text-gray-80">
                OUR COMMITMENT TO DONORS
              </p>
              <ul className="mt-5 flex flex-col gap-3">
                {donorCommitments.map((item) => (
                  <li key={item} className="flex gap-3.5">
                    <span
                      className="mt-2 size-1.5 shrink-0 rounded-full bg-green"
                      aria-hidden="true"
                    />
                    <span className="text-base leading-snug text-gray">
                      {item}
                    </span>
                  </li>
                ))}
              </ul>
            </Reveal>
          </div>

          <Reveal delay={200} className="mt-14">
            <p className="text-xs font-semibold tracking-[0.14em] text-gray-80">
              OUR DONORS
            </p>
          </Reveal>
          <div className="mt-6">
            <PartnerLogos category="donor" />
          </div>
        </Container>
      </section>

      {/* Corporate */}
      <section id="corporate" className="scroll-mt-36 bg-blue py-24 lg:py-32">
        <Container>
          <SectionHeading
            eyebrow="CORPORATE PARTNERSHIPS"
            title="Businesses creating social impact"
            dark
          />

          <Reveal delay={80} className="mt-10">
            <p className="max-w-[58ch] text-base leading-relaxed text-white-94 lg:text-[17px]">
              Companies have an important role to play in creating a more
              inclusive and sustainable society. FXB Rwanda welcomes
              partnerships with businesses that share our commitment to
              improving lives and strengthening communities.
            </p>
          </Reveal>

          <Reveal delay={120} className="mt-10">
            <p className="text-xs font-semibold tracking-[0.14em] text-white-94">
              WAYS COMPANIES CAN PARTNER WITH US
            </p>
          </Reveal>
          <div className="mt-6">
            <Cards items={corporateRoutes} dark />
          </div>

          <Reveal delay={200} className="mt-14">
            <p className="text-xs font-semibold tracking-[0.14em] text-white-94">
              LET&rsquo;S CREATE IMPACT TOGETHER
            </p>
          </Reveal>
          <div className="mt-6 rounded-card bg-white p-6 lg:p-8">
            <PartnerLogos category="corporate" />
          </div>
        </Container>
      </section>

      {/* Become a partner */}
      <section
        id="become-a-partner"
        className="scroll-mt-36 bg-white py-24 lg:py-32"
      >
        <Container>
          <SectionHeading eyebrow="BECOME A PARTNER" title="Let's work together" />

          <Reveal delay={80} className="mt-10">
            <p className="max-w-[58ch] text-base leading-relaxed text-gray lg:text-[17px]">
              Are you an organisation, institution, company or individual
              interested in supporting FXB Rwanda&rsquo;s mission? We welcome
              partnerships that bring together ideas, resources, expertise and
              commitment to create sustainable solutions for vulnerable
              children, families and communities.
            </p>
          </Reveal>

          <Reveal delay={120} className="mt-10">
            <p className="text-xs font-semibold tracking-[0.14em] text-gray-80">
              PARTNERSHIP OPPORTUNITIES
            </p>
          </Reveal>
          <div className="mt-6">
            <Cards items={partnershipOpportunities} />
          </div>

          <Reveal
            delay={200}
            className="wedge mt-14 flex flex-col items-start gap-6 bg-blue p-9 lg:p-14"
          >
            <h3 className="max-w-[24ch] text-2xl font-bold tracking-[-0.02em] text-white lg:text-[32px] lg:leading-[1.2]">
              Start a conversation
            </h3>
            <p className="max-w-[56ch] text-base leading-relaxed text-white-94 lg:text-[17px]">
              Tell us about your organisation and how you would like to
              collaborate.
            </p>
            <div className="flex flex-col gap-2 text-white">
              <a
                href={`mailto:${org.email}`}
                className="text-lg font-semibold underline underline-offset-4 transition-opacity duration-200 hover:opacity-80"
              >
                {org.email}
              </a>
              <a
                href={`tel:${org.phoneHref}`}
                className="text-lg font-semibold underline underline-offset-4 transition-opacity duration-200 hover:opacity-80"
              >
                {org.phone}
              </a>
            </div>
            <Pill href="/contact" variant="white" size="lg">
              Contact Us
            </Pill>
          </Reveal>
        </Container>
      </section>
    </>
  );
}
