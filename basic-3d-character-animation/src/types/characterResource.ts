import { AnimationType } from "./animation";

/** Character model information */
export interface CharacterResource {
  /** Model name */
  name: string;
  /** Model path (file path or URL) */
  url: string;
  /** Animation path (file path or URL) - Only some animations can be defined */
  animations?: Partial<Record<AnimationType, string>>;
}
