import { ClbToastProvider } from "@/context/ClbToastContext";

export default function SuperAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <ClbToastProvider>{children}</ClbToastProvider>;
}
