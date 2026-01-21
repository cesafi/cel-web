import { useActiveSchools } from './use-schools';

/**
 * School logo mapping for quick lookups
 */
export interface SchoolLogoMap {
  [schoolId: string]: string | null;
}

export interface SchoolLogoByAbbreviation {
  [abbreviation: string]: string | null;
}

export interface SchoolInfo {
  id: string;
  name: string;
  abbreviation: string;
  logo_url: string | null;
}

export interface SchoolInfoMap {
  [schoolId: string]: SchoolInfo;
}

export interface SchoolInfoByAbbreviation {
  [abbreviation: string]: SchoolInfo;
}

/**
 * Hook to get school logos mapped by school ID
 * Returns a map of schoolId -> logo_url for quick lookups
 */
export function useSchoolLogos() {
  const { data: schools, isLoading, error } = useActiveSchools();

  if (isLoading || error || !schools) {
    return { data: undefined, isLoading, error };
  }

  const logoMap: SchoolLogoMap = {};
  schools.forEach((school) => {
    logoMap[school.id] = school.logo_url;
  });

  return { data: logoMap, isLoading: false, error: null };
}

/**
 * Hook to get school logos mapped by abbreviation
 * Useful when you only have school abbreviations
 */
export function useSchoolLogosByAbbreviation() {
  const { data: schools, isLoading, error } = useActiveSchools();

  if (isLoading || error || !schools) {
    return { data: undefined, isLoading, error };
  }

  const logoMap: SchoolLogoByAbbreviation = {};
  schools.forEach((school) => {
    logoMap[school.abbreviation.toLowerCase()] = school.logo_url;
  });

  return { data: logoMap, isLoading: false, error: null };
}

/**
 * Hook to get complete school info mapped by school ID
 * Most comprehensive hook - includes name, abbreviation, and logo
 */
export function useSchoolInfoMap() {
  const { data: schools, isLoading, error } = useActiveSchools();

  if (isLoading || error || !schools) {
    return { data: undefined, isLoading, error };
  }

  const infoMap: SchoolInfoMap = {};
  schools.forEach((school) => {
    infoMap[school.id] = {
      id: school.id,
      name: school.name,
      abbreviation: school.abbreviation,
      logo_url: school.logo_url
    };
  });

  return { data: infoMap, isLoading: false, error: null };
}

/**
 * Hook to get complete school info mapped by abbreviation
 * Useful for components that only have school abbreviations
 */
export function useSchoolInfoByAbbreviation() {
  const { data: schools, isLoading, error } = useActiveSchools();

  if (isLoading || error || !schools) {
    return { data: undefined, isLoading, error };
  }

  const infoMap: SchoolInfoByAbbreviation = {};
  schools.forEach((school) => {
    infoMap[school.abbreviation.toLowerCase()] = {
      id: school.id,
      name: school.name,
      abbreviation: school.abbreviation,
      logo_url: school.logo_url
    };
  });

  return { data: infoMap, isLoading: false, error: null };
}

/**
 * Utility function to get school logo URL with fallback
 * Can be used with any of the above hooks
 */
export function getSchoolLogoUrl(logoUrl: string | null | undefined): string {
  return logoUrl ?? '/img/cesafi-logo.webp';
}

/**
 * Higher-order hook that combines school info with fallback logic
 * Returns a function to get logo URL by school ID with automatic fallback
 */
export function useSchoolLogoGetter() {
  const { data: schoolLogos } = useSchoolLogos();

  return (schoolId: string): string => {
    if (!schoolLogos) return '/img/cesafi-logo.webp';
    return getSchoolLogoUrl(schoolLogos[schoolId]);
  };
}

/**
 * Higher-order hook for getting logo by abbreviation with fallback
 */
export function useSchoolLogoByAbbreviationGetter() {
  const { data: schoolLogos, isLoading, error } = useSchoolLogosByAbbreviation();

  return (abbreviation: string): string => {
    // Always return fallback if still loading or error
    if (isLoading || error || !schoolLogos) {
      return '/img/cesafi-logo.webp';
    }

    // Look up the school logo by abbreviation (case insensitive)
    const logoUrl = schoolLogos[abbreviation.toLowerCase()];
    return getSchoolLogoUrl(logoUrl);
  };
}
