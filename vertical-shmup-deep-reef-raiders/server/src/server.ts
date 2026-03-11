export class Server {
  // Return game configuration including CrossRamp exchange rate.
  // IMPORTANT: Keep exchangeRate in sync with the `exchange_rate` value in .crossramp
  async getGameConfig(): Promise<{ exchangeRate: number; tokenSymbol: string; collectibleName: string }> {
    return {
      exchangeRate: 100,       // Must match exchange_rate in .crossramp
      tokenSymbol: 'REEF',     // On-chain token symbol shown in WalletOverlay
      collectibleName: 'PEARLS', // In-game collectible name shown in WalletOverlay
    };
  }

  // Award pearls after defeating sea creatures
  async claimStardust(amount: number): Promise<{ balance: number }> {
    if (amount <= 0 || amount > 1000) throw new Error('Invalid pearl amount');
    await $asset.mint('pearl', amount);
    const balance = await $asset.get('pearl');
    return { balance };
  }

  // Get current pearl balance
  async getStardustBalance(): Promise<{ balance: number }> {
    const balance = await $asset.get('pearl');
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
  async getPlayerStats(): Promise<{ bestScore: number; bestWave: number; pearls: number }> {
    const myState = await $global.getMyState();
    const pearls = await $asset.get('pearl');
    return {
      bestScore: myState.bestScore || 0,
      bestWave: myState.bestWave || 0,
      pearls
    };
  }
}
