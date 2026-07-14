import { useEffect, useState } from "react";
import { digitsEnToFa, digitsFaToEn } from "@persian-tools/persian-tools";

function PersianNumberInput({ value, onChange, ...props }) {
  const [displayValue, setDisplayValue] = useState("");

  const formatWithSeparator = (input) => {
    if (input === "" || input === null || input === undefined) return "";

    const digitsOnly = String(input).replace(/[^0-9]/g, "");
    if (!digitsOnly) return "";

    const parts = digitsOnly.replace(/^0+(?=\d)/, "").split("");
    const integerPart = parts.join("");

    return digitsEnToFa(
      integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
    );
  };

  useEffect(() => {
    if (value === "" || value === null || value === undefined) {
      setDisplayValue("");
      return;
    }

    setDisplayValue(formatWithSeparator(value));
  }, [value]);

  const handleChange = (event) => {
    const rawValue = event.target.value;
    const normalizedValue = digitsFaToEn(rawValue).replace(/[^0-9]/g, "");

    setDisplayValue(formatWithSeparator(normalizedValue));
    onChange(normalizedValue === "" ? 0 : Number(normalizedValue));
  };

  return <input {...props} type="text" inputMode="numeric" value={displayValue} onChange={handleChange} />;
}

export default PersianNumberInput;