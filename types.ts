export enum Gender {
  Male = 'Male',
  Female = 'Female'
}

export enum GenerationMode {
  Preset = 'Preset',
  Text = 'Text',
  Reference = 'Reference'
}

export interface HairstyleOption {
  id: string;
  name: string;
  label: string; // Display name in Chinese
  gender: Gender;
  category: string;
}

export interface HairColorOption {
  id: string;
  label: string;
  value: string; // Hex code for UI display
  description: string; // Text description for AI
}

export interface GeneratedImage {
  imageUrl: string;
  promptUsed: string;
}