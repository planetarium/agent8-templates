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
   * Called when a player successfully mines a crystal.
   * Mints 1 'crystal' asset to the player's account.
   */
  async collectCrystal(_crystalId: string): Promise<Record<string, number>> {
    return await $asset.mint('star_shard', 1);
  }

  /**
   * Returns the current asset balances for the calling player.
   */
  async getMyAssets(): Promise<Record<string, number>> {
    return await $asset.getAll();
  }
}
