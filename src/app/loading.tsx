import Skeleton from "react-loading-skeleton";

// Only the Hero needs a skeleton here — it's the one section on the home
// page whose content (slides) comes from a server fetch; everything below it
// (WhyUs, Customers, Features, SocialProof, FAQ, ConsultationSection) is
// static and renders instantly regardless of this route's data.
export default function Loading() {
  return (
    <section className="relative flex min-h-[calc(100vh-3.5rem)] items-center overflow-hidden py-20 sm:py-28 lg:min-h-[calc(100vh-3rem)]">
      <div className="container relative z-10">
        <div className="grid grid-cols-1 items-center gap-8 lg:grid-cols-2 lg:gap-16">
          <Skeleton
            borderRadius={24}
            className="aspect-[4/3] w-full border border-foreground/10 sm:aspect-[16/10] lg:aspect-square"
            containerClassName="order-1 lg:order-2"
          />

          <div className="order-2 text-center lg:order-1 lg:text-right">
            <Skeleton height={38} containerClassName="block mx-auto max-w-lg lg:mx-0" />
            <Skeleton height={16} containerClassName="block mx-auto mt-4 max-w-md lg:mx-0" />
            <Skeleton height={16} containerClassName="block mx-auto mt-2 max-w-sm lg:mx-0" />
            <Skeleton height={52} width={168} borderRadius={9999} containerClassName="block mx-auto mt-7 lg:mx-0 w-fit" />
          </div>
        </div>

        <div className="mx-auto mt-10 flex max-w-md items-center gap-2 lg:mt-14">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} height={4} borderRadius={9999} containerClassName="flex-1" />
          ))}
        </div>
      </div>
    </section>
  );
}
