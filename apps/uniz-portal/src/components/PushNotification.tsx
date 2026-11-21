import { useState, useEffect } from "react";

interface PushNotificationProps {
  message: string;
}

const PushNotification: React.FC<PushNotificationProps> = ({ message }) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
    }, 3000);

    return () => clearTimeout(timer); // Cleanup timeout
  }, []);

  if (!isVisible) return null; // Do not render if not visible

  return (
    <div
      role="status"
      className={`fixed bottom-5 right-5 z-50 max-w-sm rounded-lg border border-border bg-surface px-4 py-4 text-body text-text shadow-md transition-opacity duration-200 dark:shadow-none max-[639px]:inset-x-4 max-[639px]:bottom-4 max-[639px]:right-auto ${
        isVisible ? "opacity-100" : "opacity-0"
      }`}
    >
      {message}
    </div>
  );
};

export default PushNotification;
