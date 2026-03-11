class Server {
  async addGold(amount) {
    if (!amount || amount <= 0) return await $asset.get('credits');
    return await $asset.mint('credits', amount);
  }
}
