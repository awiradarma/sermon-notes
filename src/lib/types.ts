export interface Note {
  docId?: string;
  userId: string;
  title: string;
  preacher: string;
  sermonDate: Date;
  verses: string[];
  tags: string[];
  seriesTitle?: string;
  content: string;
  isPublic: boolean;
  heartCount: number;
  imageUrls: string[];
  updatedAt: Date;
}

export interface UserProfile {
  userId: string;
  knownPreachers: string[];
  displayName: string;
  themePreference: 'light' | 'dark' | 'auto';
}
