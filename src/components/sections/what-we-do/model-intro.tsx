import {
  Coins,
  GraduationCap,
  House,
  Stethoscope,
  UserMinus,
  Wheat,
} from "lucide-react";
import { Container } from "@/components/layout/container";
import { Reveal } from "@/components/ui/reveal";

/**
 * The FXBVillage model: what it is, and what it is up against.
 *
 * This section carries the `#fxbvillage-model` anchor the header menu and the
 * approach copy both link to.
 *
 * The six challenges are set alongside icons, per the brief's note. They are
 * decorative — each one sits next to the words it illustrates, so announcing
 * "wheat" before "chronic food insecurity" would only get in the way.
 */
const challenges = [
  { icon: Wheat, label: "Chronic food insecurity" },
  { icon: House, label: "Precarious housing" },
  { icon: Coins, label: "Low and irregular income" },
  { icon: Stethoscope, label: "Limited access to health care" },
  { icon: GraduationCap, label: "Risk of dropping out of school" },
  { icon: UserMinus, label: "Social isolation & widowhood" },
];

export function ModelIntro() {
  return (
    <section
      id="fxbvillage-model"
      className="scroll-mt-[var(--h-anchor)] bg-white py-24 lg:py-32"
    >
      <Container>
        <Reveal className="flex flex-col gap-5">
          <div className="flex items-center gap-4">
            <span className="h-0.5 w-6 bg-green" aria-hidden="true" />
            <span className="text-xs font-semibold tracking-[0.14em] text-gray-80">
              THE FXBVILLAGE MODEL
            </span>
          </div>
          <h2 className="max-w-[20ch] text-3xl font-bold tracking-[-0.03em] text-blue lg:text-[42px] lg:leading-[1.08]">
            A holistic route out of poverty
          </h2>
        </Reveal>

        <div className="mt-12 grid gap-6 lg:grid-cols-3 lg:gap-10">
          {[
            "The FXBVillage model is a holistic and integrated approach designed to enable families to sustainably move out of poverty, by giving parents the means to protect and raise their children. Economic empowerment is its central driver of change.",
            "However, economic support alone is not enough to ensure a lasting exit from poverty. The model therefore combines economic empowerment with access to basic services and the realisation of fundamental rights, while placing the improvement of children's and adults' quality of life at the heart of its action.",
            "By acting simultaneously on economic, social, and human dimensions, the FXBVillage model fosters lasting family transformation, improves children's wellbeing, and helps break the intergenerational cycle of poverty.",
          ].map((paragraph, index) => (
            <Reveal key={index} delay={60 + Math.min(index, 3) * 60}>
              <p className="text-base leading-relaxed text-gray lg:text-[17px]">
                {paragraph}
              </p>
            </Reveal>
          ))}
        </div>

        <Reveal delay={240} className="mt-20">
          <p className="text-xs font-semibold tracking-[0.14em] text-gray-80">
            MAIN CHALLENGES
          </p>
          <ul className="mt-8 grid gap-x-6 gap-y-7 sm:grid-cols-2 lg:grid-cols-3">
            {challenges.map(({ icon: Icon, label }) => (
              <li key={label} className="flex items-center gap-4">
                <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-blue-08">
                  <Icon className="size-5 text-blue" aria-hidden="true" />
                </span>
                <span className="text-base font-medium text-blue lg:text-[17px]">
                  {label}
                </span>
              </li>
            ))}
          </ul>

          <p className="mt-10 max-w-[58ch] text-base leading-relaxed text-gray lg:text-[17px]">
            In addition, the presence in both contexts of families affected by
            HIV further underscores the need for sustained psychosocial and
            health support.
          </p>
        </Reveal>
      </Container>
    </section>
  );
}
