class Server {
  async addGold(amount) {
    if (!amount || amount <= 0) return await $asset.get('crystal');
    return await $asset.mint('crystal', amount);
  }
}
