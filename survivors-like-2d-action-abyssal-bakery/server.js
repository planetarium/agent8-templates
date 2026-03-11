class Server {
  async addGold(amount) {
    if (!amount || amount <= 0) return await $asset.get('magic_flour');
    return await $asset.mint('magic_flour', amount);
  }
}