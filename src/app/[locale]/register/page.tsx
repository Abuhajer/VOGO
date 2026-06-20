import { setRequestLocale } from "next-intl/server";
import RegisterForm from "@/components/auth/RegisterForm";

export default function RegisterPage({ params: { locale } }: { params: { locale: string } }) {
  setRequestLocale(locale);
  return <RegisterForm />;
}
