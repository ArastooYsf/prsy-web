import type { ProductSpec } from "@/lib/product-json";

export default function ProductSpecsTable({ specs }: { specs: ProductSpec[] }) {
  if (specs.length === 0) return null;

  return (
    <div className="overflow-hidden rounded-2xl border border-foreground/10">
      <table className="w-full text-sm">
        <tbody>
          {specs.map((spec, i) => (
            <tr key={spec.label + i} className={i % 2 === 1 ? "bg-foreground/[0.02]" : undefined}>
              <th
                scope="row"
                className="w-2/5 whitespace-nowrap px-4 py-3 text-right font-semibold text-foreground/70 sm:w-1/3"
              >
                {spec.label}
              </th>
              <td className="px-4 py-3 text-foreground/90">{spec.value}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
