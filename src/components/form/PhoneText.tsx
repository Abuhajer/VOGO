import { formatPhoneForDisplay, PHONE_LTR_CLASS } from "@/lib/format";

type Props = {
  value: string;
  className?: string;
  as?: "span" | "p" | "dd";
};

export default function PhoneText({ value, className = "", as: Tag = "span" }: Props) {
  const text = formatPhoneForDisplay(value);
  if (!text) return null;

  return (
    <Tag dir="ltr" className={`${PHONE_LTR_CLASS} ${className}`.trim()}>
      {text}
    </Tag>
  );
}
