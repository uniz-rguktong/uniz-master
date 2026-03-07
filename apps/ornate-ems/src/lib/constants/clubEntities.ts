// Club/Entity data structure
export interface ClubEntity {
  id: string;
  name: string;
  shortName: string;
  coordinator: string;
  establishedYear: string;
  description: string;
  email: string;
  phone: string;
  logo: string | null;
  profilePicture?: string;
  stats: { members: number; events: number };
}

/**
 * Minimal display-name metadata for entities.
 * Used as fallback when Admin.preferences doesn't store these values.
 * Real coordinator info, stats, and contact details come from the DB.
 */
export const ENTITY_METADATA: Record<
  string,
  {
    name: string;
    shortName: string;
    description: string;
    establishedYear: string;
  }
> = {
  super_admin: {
    name: "System Super Admin",
    shortName: "SA",
    description: "Overarching system administration and governance.",
    establishedYear: "2020",
  },
  techexcel: {
    name: "TechExcel",
    shortName: "TX",
    description: "TechExcel organizes various events and workshops.",
    establishedYear: "2020",
  },
  sarvasrijana: {
    name: "Sarvasrijana",
    shortName: "SS",
    description: "Fostering creativity and multidisciplinary projects.",
    establishedYear: "2021",
  },
  artix: {
    name: "Artix",
    shortName: "AX",
    description: "The premier arts and design collective.",
    establishedYear: "2019",
  },
  kaladharani: {
    name: "Kaladharani",
    shortName: "KD",
    description: "Preserving and promoting traditional dance forms.",
    establishedYear: "2018",
  },
  khelsaathi: {
    name: "Khelsaathi",
    shortName: "KS",
    description: "Integrated sports and fitness management.",
    establishedYear: "2022",
  },
  icro: {
    name: "ICRO",
    shortName: "IR",
    description: "Institutional Club for Robotics and Operations.",
    establishedYear: "2020",
  },
  pixelro: {
    name: "PixelRo",
    shortName: "PR",
    description: "Advanced photography and digital media club.",
    establishedYear: "2021",
  },
  branch_cse: {
    name: "CSE Department",
    shortName: "CSE",
    description: "Department of Computer Science and Engineering.",
    establishedYear: "2015",
  },
  branch_ece: {
    name: "ECE Department",
    shortName: "ECE",
    description: "Department of Electronics and Communication Engineering.",
    establishedYear: "2016",
  },
  branch_eee: {
    name: "EEE Department",
    shortName: "EEE",
    description: "Department of Electrical and Electronics Engineering.",
    establishedYear: "2017",
  },
  branch_mech: {
    name: "MECH Department",
    shortName: "MECH",
    description: "Department of Mechanical Engineering.",
    establishedYear: "2016",
  },
  branch_civil: {
    name: "CIVIL Department",
    shortName: "CIVIL",
    description: "Department of Civil Engineering.",
    establishedYear: "2015",
  },
  hho: {
    name: "HHO",
    shortName: "HO",
    description: "Hand-Holding Organization for student success.",
    establishedYear: "2018",
  },
  sports_admin: {
    name: "Sports Administration",
    shortName: "SA",
    description: "Governing body for all institutional sports events.",
    establishedYear: "2015",
  },
};
