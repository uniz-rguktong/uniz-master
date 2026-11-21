/**
 * UniZ design system — single import for token class strings.
 *
 * Portal surfaces: import from portal-ui / student-ui
 * Public pages: import from landing-ui
 * Admin: import from admin-ui (extends portal-ui)
 *
 * The portal is light only. forceLightTheme() strips a stored dark preference.
 */

export * from "@/lib/portal-ui";
export * from "@/lib/student-ui";
export * from "@/lib/landing-ui";
