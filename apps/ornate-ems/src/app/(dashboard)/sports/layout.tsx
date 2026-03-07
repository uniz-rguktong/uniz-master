import { CoordinatorProvider } from "@/context/CoordinatorContext";
import { ClbToastProvider } from "@/context/ClbToastContext";

export default function SportsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <CoordinatorProvider>
      <ClbToastProvider>{children}</ClbToastProvider>
    </CoordinatorProvider>
  );
}
