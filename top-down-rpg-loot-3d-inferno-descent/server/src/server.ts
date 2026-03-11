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
   * Called when a player successfully harvests a fire soul.
   * Mints 1 'fire_soul' asset to the player's account.
   */
  async collectSoul(_soulId: string): Promise<Record<string, number>> {
    return await $asset.mint('fire_soul', 1);
  }

  /**
   * Returns the current asset balances for the calling player.
   */
  async getMyAssets(): Promise<Record<string, number>> {
    return await $asset.getAll();
  }
}
