import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Clock, MapPin } from "lucide-react";
import { Container } from "@/components/layout/container";
import { PageHeader } from "@/components/layout/page-header";
import { PhotoBand } from "@/components/sections/photo-band";
import { getPhotos } from "@/cms/content/photos";
import { EmptyState } from "@/components/ui/empty-state";
import { Reveal } from "@/components/ui/reveal";
import { formatDate } from "@/cms/content/date";
import { getOpenings } from "@/cms/content/opportunities";

export const metadata: Metadata = {
  title: "Careers",
  description:
    "Current career opportunities at FXB Rwanda. Join a team dedicated to making a meaningful impact across Rwanda.",
};

/**
 * Careers — the listing.
 *
 * It used to be the listing and every job description at once: each vacancy
 * printed its full body, its location, its closing date and its download in a
 * row of the same list. Three vacancies made a page nobody could scan, and
 * there was nothing to link to — no address for a particular post, nothing to
 * send to a candidate, nothing for a search engine to index as a job, and
 * nowhere to put an application form.
 *
 * So this is a list of posts and nothing else: title, what it is, where it is,
 * when it closes. The description and the form live on the post's own page,
 * which is where somebody who has decided to read properly is going anyway.
 *
 * The empty state stays. The brief writes this page twice — once with
 * vacancies and once without — and the heading changes with it, because "Join
 * Our Team" over "there are no open positions" reads as a broken page.
 */
export default async function CareersPage() {
  const photos = await getPhotos(["fostering-02.jpg"]);
  const vacancies = await getOpenings("career");
  const open = vacancies.length > 0;

  return (
    <>
      <PageHeader
        path="/get-involved/careers"
        breadcrumbs={[{ label: "Get Involved", href: "/get-involved" }]}
        eyebrow="CAREERS"
        title={open ? "Join our team" : "Build a career with purpose"}
        intro={
          open
            ? "At FXB Rwanda, our people are at the heart of our mission. We are always looking for passionate and talented individuals committed to creating lasting change for vulnerable children, families and communities."
            : "At FXB Rwanda, our people are at the heart of our mission. We are always looking for passionate and talented individuals committed to creating lasting change."
        }
      />

      <section className="bg-white pt-20 pb-24 lg:pt-28 lg:pb-32">
        {open ? (
          <Container>
            <Reveal className="flex flex-col gap-3">
              <div className="flex items-center gap-4">
                <span className="h-0.5 w-6 bg-green" aria-hidden="true" />
                <span className="text-xs font-semibold tracking-[0.18em] text-gray-80">
                  OPEN POSITIONS
                </span>
              </div>
              <h2 className="text-3xl font-bold tracking-[-0.03em] text-blue lg:text-[42px] lg:leading-[1.08]">
                {vacancies.length === 1
                  ? "One position is open"
                  : `${vacancies.length} positions are open`}
              </h2>
            </Reveal>

            <ul className="mt-12 flex flex-col">
              {vacancies.map((vacancy, index) => (
                <Reveal
                  as="li"
                  key={vacancy.id}
                  delay={Math.min(index, 3) * 60}
                  className="border-t border-gray-15 last:border-b"
                >
                  {/* The whole row is the link, not a "read more" at the end of
                      it. A row that is a link everywhere is a target the size
                      of the row; a link at the end of it is a target the size
                      of two words, and on a phone it is the difference between
                      tapping and aiming. */}
                  <Link
                    href={`/get-involved/careers/${vacancy.slug}`}
                    className="group flex flex-col gap-6 py-9 transition-colors duration-300 lg:flex-row lg:items-center lg:justify-between lg:gap-16"
                  >
                    <div className="flex flex-col gap-3 lg:max-w-[52ch]">
                      <h3 className="text-2xl font-bold tracking-[-0.02em] text-blue transition-colors duration-300 group-hover:text-green lg:text-[28px]">
                        {vacancy.title}
                      </h3>

                      {vacancy.summary && (
                        <p className="text-base leading-relaxed text-gray">
                          {vacancy.summary}
                        </p>
                      )}

                      <div className="mt-1 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-gray-80">
                        {vacancy.employment && (
                          <span className="rounded-full bg-blue-08 px-3 py-1 text-xs font-semibold tracking-wide text-blue uppercase">
                            {vacancy.employment}
                          </span>
                        )}
                        {vacancy.location && (
                          <span className="flex items-center gap-2">
                            <MapPin className="size-4" aria-hidden="true" />
                            {vacancy.location}
                          </span>
                        )}
                        <span className="flex items-center gap-2">
                          <Clock className="size-4" aria-hidden="true" />
                          Closes {formatDate(vacancy.closesAt)}
                        </span>
                      </div>
                    </div>

                    <span className="flex shrink-0 items-center gap-3 text-base font-semibold text-blue">
                      View and apply
                      <span className="flex size-10 items-center justify-center rounded-full border border-gray-15 transition-colors duration-500 group-hover:border-blue group-hover:bg-blue">
                        <ArrowRight
                          className="size-4 transition-colors duration-500 group-hover:text-white"
                          aria-hidden="true"
                        />
                      </span>
                    </span>
                  </Link>
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

      {photos["fostering-02.jpg"] && (
        <PhotoBand image={photos["fostering-02.jpg"]}>
          The work is done by people who live where it happens.
        </PhotoBand>
      )}
    </>
  );
}
