/**
 * Onboarding layout — full screen, no bottom nav
 */
export default function OnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="h-full flex flex-col bg-spal-bg">
      {children}
    </div>
  );
}
