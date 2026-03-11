class Server {
  async addGold(amount) {
    if (!amount || amount <= 0) return await $asset.get('pearl');
    return await $asset.mint('pearl', amount);
  }
}
