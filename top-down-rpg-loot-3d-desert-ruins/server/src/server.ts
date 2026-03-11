/**
 * Agent8 GameServer
 *
 * Install types: npm install -D @agent8/gameserver-node
 * Types are automatically available: $global, $sender, $room, $asset
 */

export class Server {
  async ping(): Promise<string> {
    return 'pong';
  }

  async getMyAccount(): Promise<string> {
    return $sender.account;
  }

  /**
   * Called when a player successfully excavates an ancient relic.
   * Mints 1 'relic' asset to the player's account.
   */
  async collectRelic(_relicId: string): Promise<Record<string, number>> {
    return await $asset.mint('relic', 1);
  }

  /**
   * Returns the current asset balances for the calling player.
   */
  async getMyAssets(): Promise<Record<string, number>> {
    return await $asset.getAll();
  }
}
