export enum AppTheme {
  NEO_BLUE = 'NEO_BLUE',
  HIGH_CONTRAST = 'HIGH_CONTRAST',
  SOFT_GLOW = 'SOFT_GLOW',
}

export enum AppMode {
  SCENE = 'SCENE',
  PEOPLE = 'PEOPLE',
  OBJECT = 'OBJECT',
  TEXT = 'TEXT',
}

export interface Settings {
  voiceSpeed: number; // 0.5 to 2.0
  hapticsEnabled: boolean;
  voiceGender: 'male' | 'female' | 'default';
  autoFlash: boolean;
}

export interface ProcessingResult {
  text: string;
  imageUri: string;
  mode: AppMode;
  timestamp: number;
}
