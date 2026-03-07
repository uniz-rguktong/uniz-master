"use client";

import { createContext, useContext, useState, useEffect } from "react";
import type { ClubEntity } from "@/lib/constants/clubEntities";

interface ClubContextType {
  clubDetails: ClubEntity;
  clubs: ClubEntity[];
  selectedClubId: string;
  setClubId: (id: string) => void;
  updateClubDetails: (newDetails: Partial<ClubEntity>) => void;
}

const ClubContext = createContext<ClubContextType | undefined>(undefined);

interface ClubProviderProps {
  children: React.ReactNode;
  initialEntity: ClubEntity;
  initialEntities: ClubEntity[];
}

export function ClubProvider({
  children,
  initialEntity,
  initialEntities,
}: ClubProviderProps) {
  const [entities, setEntities] = useState<Record<string, ClubEntity>>(() => {
    // Convert array to map
    const map: Record<string, ClubEntity> = {};
    initialEntities.forEach((entity) => {
      map[entity.id] = entity;
    });
    return map;
  });
  const [selectedClubId, setSelectedClubId] = useState<string>(
    initialEntity.id,
  );

  const activeClub = entities[selectedClubId] || initialEntity;

  const updateClubDetails = (newDetails: Partial<ClubEntity>) => {
    setEntities((prev) => ({
      ...prev,
      [selectedClubId]: {
        ...prev[selectedClubId],
        ...newDetails,
      } as ClubEntity,
    }));
  };

  // Fetch live data from backend for detailed profile info (logo/picture)
  useEffect(() => {
    import("@/actions/clubSettingsActions").then(async (mod) => {
      const result = await mod.getClubSettings();
      if (result.success && result.data) {
        const settingsData = result.data;
        setEntities((prev) => ({
          ...prev,
          [selectedClubId]: {
            ...prev[selectedClubId],
            logo: settingsData.logo || prev[selectedClubId]?.logo,
          } as ClubEntity,
        }));
      }
      const profile = await mod.getAdminProfile();
      if (profile.success && profile.data) {
        const profileData = profile.data;
        setEntities((prev) => ({
          ...prev,
          [selectedClubId]: {
            ...prev[selectedClubId],
            profilePicture: profileData.profilePicture,
          } as ClubEntity,
        }));
      }
    });
  }, [selectedClubId]);

  const setClubId = (id: string) => {
    if (entities[id]) {
      setSelectedClubId(id);
    }
  };

  return (
    <ClubContext.Provider
      value={{
        clubDetails: activeClub,
        clubs: Object.values(entities),
        selectedClubId,
        setClubId,
        updateClubDetails,
      }}
    >
      {children}
    </ClubContext.Provider>
  );
}

export function useClub() {
  const context = useContext(ClubContext);
  if (!context) {
    throw new Error("useClub must be used within a ClubProvider");
  }
  return context;
}
