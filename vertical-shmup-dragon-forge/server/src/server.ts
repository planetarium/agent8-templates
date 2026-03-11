export class Server {
  // Return game configuration including CrossRamp exchange rate.
  // IMPORTANT: Keep exchangeRate in sync with the `mint_ratio` value used during CrossRamp deploy (10:1)
  async getGameConfig(): Promise<{ exchangeRate: number; tokenSymbol: string; collectibleName: string }> {
    return {
      exchangeRate: 10,          // 10 embers = 1 DFT token (matches CrossRamp mint_ratio)
      tokenSymbol: 'DFT',       // Dragon Forge Token
      collectibleName: 'EMBER',  // In-game collectible name
    };
  }

  // Award ember crystals after defeating enemies
  async claimStardust(amount: number): Promise<{ balance: number }> {
    if (amount <= 0 || amount > 2000) throw new Error('Invalid ember amount');
    await $asset.mint('ember', amount);
    const balance = await $asset.get('ember');
    return { balance };
  }

  // Get current ember balance
  async getStardustBalance(): Promise<{ balance: number }> {
    const balance = await $asset.get('ember');
    return { balance };
  }

  // Save high score
  async saveHighScore(score: number, wave: number): Promise<{ isNewBest: boolean; bestScore: number }> {
    if (typeof score !== 'number' || score < 0) throw new Error('Invalid score');
    const myState = await $global.getMyState();
    const currentBest = myState.bestScore || 0;
    const isNewBest = score > currentBest;
    if (isNewBest) {
      await $global.updateMyState({ bestScore: score, bestWave: wave });
    }
    // Update leaderboard
    const existing = await $global.getCollectionItems('leaderboard', {
      filters: [{ field: 'account', operator: '==', value: $sender.account }],
      limit: 1
    });
    if (existing.length > 0) {
      if (isNewBest) {
        await $global.updateCollectionItem('leaderboard', { __id: existing[0].__id, account: $sender.account, score, wave });
      }
    } else {
      await $global.addCollectionItem('leaderboard', { account: $sender.account, score, wave });
    }
    return { isNewBest, bestScore: isNewBest ? score : currentBest };
  }

  // Get top leaderboard entries
  async getLeaderboard(): Promise<any[]> {
    const items = await $global.getCollectionItems('leaderboard', {
      orderBy: [{ field: 'score', direction: 'desc' }],
      limit: 10
    });
    return items;
  }

  // Get player stats
  async getPlayerStats(): Promise<{ bestScore: number; bestWave: number; ember: number }> {
    const myState = await $global.getMyState();
    const ember = await $asset.get('ember');
    return {
      bestScore: myState.bestScore || 0,
      bestWave: myState.bestWave || 0,
      ember
    };
  }
}
