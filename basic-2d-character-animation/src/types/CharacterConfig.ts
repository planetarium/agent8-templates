export type CharacterDirection = 'left' | 'right';

export interface CharacterConfig {
  imageUrl: string;
  frame: {
    width: number;
    height: number;
  };
  direction?: CharacterDirection;
  origin: {
    x: number;
    y: number;
  };
  body: {
    size: {
      width: number;
      height: number;
    };
    offset: {
      x: number;
      y: number;
    };
  };
  animations: {
    [key: string]: {
      start: number;
      end: number;
      frameRate: number;
      repeat: number;
    };
  };
}
