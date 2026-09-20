"use client";

import { forwardRef, type ChangeEvent, type InputHTMLAttributes } from "react";
import { formatNumber, toLatinDigits } from "@/lib/format-number";

function extractDigits(input: string): string {
  return toLatinDigits(input).replace(/[^0-9]/g, "");
}

function isDigit(char: string): boolean {
  return /[0-9۰-۹]/.test(char);
}

type FormattedNumberInputProps = Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "value" | "onChange" | "type"
> & {
  /** Raw digits only (e.g. "1850000") — same shape the field already stored before, just formatted for display. */
  value: string;
  /** Fires with the same raw-digit shape, ready for `Number(value)` like every existing call site already does. */
  onChange: (rawDigits: string) => void;
};

// A price/amount field that shows the central formatNumber() grouping (with
// Persian digits) live as the user types, instead of only after the value is
// saved — Radix/native `<input type="number">` can't render that (it rejects
// non-ASCII characters), so this is a plain text input that reformats on
// every keystroke while re-deriving the caret position, so it doesn't jump
// to the end the way naively re-rendering a formatted value would.
const FormattedNumberInput = forwardRef<HTMLInputElement, FormattedNumberInputProps>(
  function FormattedNumberInput({ value, onChange, ...rest }, ref) {
    const displayValue = value ? formatNumber(Number(value)) : "";

    const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
      const el = event.target;
      // el.value/el.selectionStart here are the browser's own post-edit
      // state (its native insert/delete already happened before this
      // handler runs) — both are in the same index space, so counting
      // digits up to the caret directly against el.value (never against the
      // old formatted `displayValue`, a different string entirely) is what
      // keeps this correct.
      const cursor = el.selectionStart ?? el.value.length;
      const digitsBeforeCursor = extractDigits(el.value.slice(0, cursor)).length;

      const rawDigits = extractDigits(el.value);
      const nextFormatted = rawDigits ? formatNumber(Number(rawDigits)) : "";

      let nextCursor = digitsBeforeCursor === 0 ? 0 : nextFormatted.length;
      let seen = 0;
      for (let i = 0; i < nextFormatted.length; i++) {
        if (isDigit(nextFormatted[i])) {
          seen++;
          if (seen === digitsBeforeCursor) {
            nextCursor = i + 1;
            break;
          }
        }
      }

      // Written directly to the DOM (not left to React's next render) so the
      // caret is already correct before the controlled re-render — by the
      // time React re-renders with the same string, there's nothing left to
      // reconcile and the caret stays put instead of jumping to the end.
      el.value = nextFormatted;
      el.setSelectionRange(nextCursor, nextCursor);

      onChange(rawDigits);
    };

    return (
      <input
        ref={ref}
        type="text"
        inputMode="numeric"
        dir="ltr"
        value={displayValue}
        onChange={handleChange}
        {...rest}
      />
    );
  },
);

export default FormattedNumberInput;
