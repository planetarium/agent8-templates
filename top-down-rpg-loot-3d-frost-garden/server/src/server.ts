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
   * Called when a player successfully gathers a starflower crystal.
   * Mints 1 'starflower' asset to the player's account.
   */
  async collectStarflower(_crystalId: string): Promise<Record<string, number>> {
    return await $asset.mint('starflower', 1);
  }

  /**
   * Returns the current asset balances for the calling player.
   */
  async getMyAssets(): Promise<Record<string, number>> {
    return await $asset.getAll();
  }
}
