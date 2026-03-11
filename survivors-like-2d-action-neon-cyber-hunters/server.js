class Server {
  async addGold(amount) {
    if (!amount || amount <= 0) return await $asset.get('gold');
    return await $asset.mint('gold', amount);
  }
}
