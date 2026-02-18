"use client";
import { cn } from "../../utils/cn";
import React, { useState, createContext, useContext } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Menu, ChevronLeft } from "lucide-react";

interface Links {
  label: string;
  href: string;
  icon: React.JSX.Element | React.ReactNode;
  onClick?: () => void;
}

interface SidebarContextProps {
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
  animate: boolean;
}

const SidebarContext = createContext<SidebarContextProps | undefined>(
  undefined,
);

export const useSidebar = () => {
  const context = useContext(SidebarContext);
  if (!context) {
    throw new Error("useSidebar must be used within a SidebarProvider");
  }
  return context;
};

export const SidebarProvider = ({
  children,
  open: openProp,
  setOpen: setOpenProp,
  animate = true,
}: {
  children: React.ReactNode;
  open?: boolean;
  setOpen?: React.Dispatch<React.SetStateAction<boolean>>;
  animate?: boolean;
}) => {
  const [openState, setOpenState] = useState(false);

  const open = openProp !== undefined ? openProp : openState;
  const setOpen = setOpenProp !== undefined ? setOpenProp : setOpenState;

  return (
    <SidebarContext.Provider value={{ open, setOpen, animate: animate }}>
      {children}
    </SidebarContext.Provider>
  );
};

export const Sidebar = ({
  children,
  open,
  setOpen,
  animate,
}: {
  children: React.ReactNode;
  open?: boolean;
  setOpen?: React.Dispatch<React.SetStateAction<boolean>>;
  animate?: boolean;
}) => {
  return (
    <SidebarProvider open={open} setOpen={setOpen} animate={animate}>
      {children}
    </SidebarProvider>
  );
};

export const SidebarBody = (props: React.ComponentProps<typeof motion.div>) => {
  return (
    <>
      <DesktopSidebar {...props} />
      <MobileSidebar {...(props as React.ComponentProps<"div">)} />
    </>
  );
};

export const DesktopSidebar = ({
  className,
  children,
  ...props
}: React.ComponentProps<typeof motion.div>) => {
  return (
    <>
      <motion.div
        className={cn(
          "h-full px-4 py-6 hidden md:flex md:flex-col bg-slate-50 border-r border-slate-200 shrink-0",
          className,
        )}
        animate={{
          width: "280px",
        }}
        transition={{
          duration: 0.4,
          ease: [0.33, 1, 0.68, 1], // cubic-bezier for smooth expansion
        }}
        {...props}
      >
        {children}
      </motion.div>
    </>
  );
};

export const MobileSidebar = ({
  className,
  children,
  ...props
}: React.ComponentProps<"div">) => {
  const { open, setOpen } = useSidebar();
  return (
    <>
      <div
        className={cn(
          "h-16 px-6 flex flex-row md:hidden items-center justify-between bg-white border-b border-neutral-200 w-full sticky top-0 z-50",
          className,
        )}
        {...props}
      >
        <div
          className="flex items-center gap-2 z-[60] cursor-pointer"
          onClick={() => setOpen(false)}
        >
          <img
            src="/assets/ongole_logo.png"
            className="h-8 w-8 object-contain"
            alt="Ongole Logo"
          />
          <span className="text-xl font-extrabold tracking-tighter text-black">
            Ongole
          </span>
        </div>

        <div className="flex justify-end z-[60]">
          {open ? (
            <ChevronLeft
              className="text-black h-6 w-6"
              onClick={() => setOpen(false)}
            />
          ) : (
            <Menu
              className="text-black h-6 w-6"
              onClick={() => setOpen(true)}
            />
          )}
        </div>
        <AnimatePresence>
          {open && (
            <motion.div
              initial={{ x: "-100%", opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: "-100%", opacity: 0 }}
              transition={{
                duration: 0.3,
                ease: "easeInOut",
              }}
              className={cn(
                "fixed h-full w-full inset-0 bg-white p-6 pt-24 z-[40] flex flex-col justify-between overflow-y-auto",
                className,
              )}
            >
              {/* We don't need the close button inside since the hamburger toggles it, but if users want one we can keep or remove. 
                                The original code had a close button 'X' inside. I'll keep the X button logic or maybe remove it since hamburger usually toggles.
                                The user asked for hamburger to work. 
                                Let's keep the X but maybe position it better or rely on the header.
                                Actually, if the header is sticky z-50, and this drawer is z-40, the header stays on top.
                                So the hamburger can toggle closed.
                            */}
              {children}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  );
};

export const SidebarLink = ({
  link,
  className,
  isActive,
  ...props
}: {
  link: Links;
  className?: string;
  isActive?: boolean;
}) => {
  const { setOpen } = useSidebar();
  return (
    <a
      href={link.href}
      onClick={(e) => {
        if (link.onClick) {
          e.preventDefault();
          link.onClick();
          setOpen(false); // Close sidebar on selection
        }
      }}
      className={cn(
        "flex items-center group/sidebar py-2 px-2 rounded-xl transition-all duration-200 mb-2 mx-1",
        "justify-start gap-2",
        isActive
          ? "bg-[#800000] text-white shadow-md hover:bg-[#600000]"
          : "text-neutral-700 hover:bg-neutral-100 hover:text-black",
        className,
      )}
      {...props}
    >
      {link.icon}

      <motion.span
        animate={{
          width: "auto",
          opacity: 1,
          x: 0,
        }}
        transition={{
          duration: 0.3,
          ease: [0.4, 0, 0.2, 1], // material design easing curve
        }}
        className={cn(
          "text-sm font-bold tracking-tight whitespace-nowrap overflow-hidden",
          isActive
            ? "text-white"
            : "text-neutral-600 group-hover/sidebar:text-black",
        )}
      >
        {link.label}
      </motion.span>
    </a>
  );
};
