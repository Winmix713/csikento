import type { ReactNode } from "react";

// ========================================================================================
// COMPONENT TYPE CONFIGURATION
// ========================================================================================

export interface ComponentType {
  id: string;
  label: string;
  icon: ReactNode;
}

/**
 * SVG Icon components for component types
 */
const ButtonIcon = () => (
  <>
    <rect x="3" y="8" width="18" height="8" rx="4" />
    <line x1="8" y1="12" x2="16" y2="12" />
  </>
);

const CardIcon = () => (
  <>
    <rect x="3" y="4" width="18" height="16" rx="3" />
    <line x1="3" y1="9" x2="21" y2="9" />
  </>
);

const HeaderIcon = () => (
  <>
    <rect x="2" y="3" width="20" height="5" rx="2" />
    <line x1="5" y1="5.5" x2="10" y2="5.5" />
    <circle cx="18" cy="5.5" r="1.2" fill="currentColor" stroke="none" />
    <circle cx="14.5" cy="5.5" r="1.2" fill="currentColor" stroke="none" />
  </>
);

const HeroIcon = () => (
  <>
    <rect x="2" y="3" width="20" height="13" rx="2" />
    <line x1="7" y1="8" x2="17" y2="8" />
    <line x1="9" y1="11" x2="15" y2="11" />
    <rect x="8" y="19" width="8" height="3" rx="1.5" />
  </>
);

const InputIcon = () => (
  <>
    <rect x="3" y="8" width="18" height="8" rx="2" />
    <line x1="7" y1="12" x2="7.01" y2="12" strokeWidth={2.2} />
  </>
);

const ModalIcon = () => (
  <>
    <rect x="4" y="5" width="16" height="14" rx="2" />
    <line x1="4" y1="9" x2="20" y2="9" />
    <line x1="17" y1="7" x2="17.01" y2="7" strokeWidth={2} />
    <line x1="14.5" y1="7" x2="14.51" y2="7" strokeWidth={2} />
  </>
);

const NavIcon = () => (
  <>
    <line x1="4" y1="7" x2="20" y2="7" />
    <line x1="4" y1="12" x2="20" y2="12" />
    <line x1="4" y1="17" x2="14" y2="17" />
  </>
);

const BadgeIcon = () => (
  <>
    <rect x="5" y="9" width="14" height="6" rx="3" />
    <line x1="9" y1="12" x2="15" y2="12" strokeWidth={1.3} />
  </>
);

// Map icon components for easy rendering
export const COMPONENT_ICONS: Record<string, ReactNode> = {
  button: <ButtonIcon />,
  card: <CardIcon />,
  header: <HeaderIcon />,
  hero: <HeroIcon />,
  input: <InputIcon />,
  modal: <ModalIcon />,
  nav: <NavIcon />,
  badge: <BadgeIcon />,
};

/**
 * All available component types with their configuration
 * Use readonly array for type safety
 */
export const COMPONENT_TYPES: readonly ComponentType[] = [
  { id: "button", label: "Button", icon: <ButtonIcon /> },
  { id: "card", label: "Card", icon: <CardIcon /> },
  { id: "header", label: "Header", icon: <HeaderIcon /> },
  { id: "hero", label: "Hero", icon: <HeroIcon /> },
  { id: "input", label: "Input", icon: <InputIcon /> },
  { id: "modal", label: "Modal", icon: <ModalIcon /> },
  { id: "nav", label: "Nav", icon: <NavIcon /> },
  { id: "badge", label: "Badge", icon: <BadgeIcon /> },
] as const;

/**
 * Type-safe component type IDs
 * Usage: const type: ComponentTypeId = 'button';
 */
export type ComponentTypeId = typeof COMPONENT_TYPES[number]["id"];

/**
 * Get component type by ID
 * @param id - Component type ID
 * @returns ComponentType or undefined
 */
export function getComponentType(id: string): ComponentType | undefined {
  return COMPONENT_TYPES.find((c) => c.id === id);
}

/**
 * Check if a component type ID is valid
 * @param id - ID to check
 * @returns boolean
 */
export function isValidComponentType(id: string): id is ComponentTypeId {
  return COMPONENT_TYPES.some((c) => c.id === id);
}

/**
 * Get default component type
 * @returns Default component type ('button')
 */
export function getDefaultComponentType(): ComponentType {
  return COMPONENT_TYPES[0];
}
