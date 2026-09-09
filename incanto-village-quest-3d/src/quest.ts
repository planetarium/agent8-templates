/**
 * Cross-scene quest state. `goToScene` swaps the node tree but the module
 * lives for the whole page — the natural home for "what has the player done".
 */
export const quest = {
  /** The Elder asked; the grove gate opens. */
  accepted: false,
  /** All wolves down; report back. */
  cleared: false,
  /** Reported back; quest complete. */
  done: false,
};

export function resetQuest(): void {
  quest.accepted = false;
  quest.cleared = false;
  quest.done = false;
}
