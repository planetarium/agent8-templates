/**
 * Agent8 GameServer - NEON DRIFT: Cyber Arena
 */

export class Server {
  async ping(): Promise<string> {
    return 'pong';
  }

  async getMyAccount(): Promise<string> {
    return $sender.account;
  }

  async collectFragment(_fragmentId: string): Promise<Record<string, number>> {
    return await $asset.mint('data_fragment', 1);
  }

  async getMyAssets(): Promise<Record<string, number>> {
    return await $asset.getAll();
  }
}
