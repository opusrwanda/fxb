import type { Metadata } from "next";
import { Container } from "@/components/layout/container";
import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { Pill } from "@/components/ui/pill";
import { Reveal } from "@/components/ui/reveal";
import { formatDeadline, vacancies } from "@/lib/opportunities";

export const metadata: Metadata = {
  title: "Careers",
  description:
    "Current career opportunities at FXB Rwanda. Join a team dedicated to making a meaningful impact across Rwanda.",
};

/**
 * Careers.
 *
 * The brief writes this page twice — once with vacancies and once without —
 * and the empty version is the one that runs today. Both states are built; the
 * page switches on `vacancies` in `opportunities.ts`.
 *
 * The heading and intro change with the state too, because "Join Our Team" over
 * "there are no open positions" reads as a broken page.
 */
export default function CareersPage() {
  const open = vacancies.length > 0;

  return (
    <>
      <PageHeader
        breadcrumbs={[{ label: "Get Involved", href: "/get-involved" }]}
        eyebrow="CAREERS"
        title={open ? "Join our team" : "Build a career with purpose"}
        intro={
          open
            ? "At FXB Rwanda, our people are at the heart of our mission. We are always looking for passionate and talented individuals committed to creating lasting change for vulnerable children, families and communities."
            : "At FXB Rwanda, our people are at the heart of our mission. We are always looking for passionate and talented individuals committed to creating lasting change."
        }
      />

      <section className="bg-white pb-24 lg:pb-32">
        {open ? (
          <Container>
            <ul className="flex flex-col">
              {vacancies.map((vacancy, index) => (
                <Reveal
                  as="li"
                  key={vacancy.slug}
                  delay={Math.min(index, 3) * 60}
                  className="border-t border-gray-15 last:border-b"
                >
                  <div className="flex flex-col gap-6 py-9 lg:flex-row lg:items-start lg:justify-between lg:gap-16">
                    <div className="flex flex-col gap-3 lg:max-w-[44ch]">
                      <h2 className="text-2xl font-bold tracking-[-0.02em] text-blue lg:text-[28px]">
                        {vacancy.title}
                      </h2>
                      <p className="text-base text-gray">
                        {vacancy.department} · {vacancy.location} ·{" "}
                        {vacancy.employmentType}
                      </p>
                      <p className="text-sm font-semibold text-blue">
                        Apply by {formatDeadline(vacancy.deadline)}
                      </p>
                    </div>

                    <div className="flex flex-1 flex-col items-start gap-5">
                      {vacancy.howToApply.map((paragraph, i) => (
                        <p
                          key={i}
                          className="max-w-[56ch] text-[15px] leading-relaxed text-gray"
                        >
                          {paragraph}
                        </p>
                      ))}
                      {vacancy.file && (
                        <Pill href={vacancy.file} variant="primary">
                          Download the full pack
                        </Pill>
                      )}
                    </div>
                  </div>
                </Reveal>
              ))}
            </ul>
          </Container>
        ) : (
          <EmptyState
            title="There are currently no vacancies"
            body="We appreciate your interest in joining our team. New opportunities are posted here whenever positions become available, so it is worth checking back. In the meantime, you can learn more about our work, follow us on social media, or explore ways to support our mission through partnerships, volunteering and advocacy."
            note="Please check back soon."
            actions={[
              { label: "Explore Our Work", href: "/what-we-do", primary: true },
              { label: "Partner With Us", href: "/get-involved/partners" },
            ]}
          />
        )}
      </section>
    </>
  );
}
