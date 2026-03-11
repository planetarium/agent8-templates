export class Server {
  // Return game configuration including CrossRamp exchange rate.
  // IMPORTANT: Keep exchangeRate in sync with the `exchange_rate` value in .crossramp
  async getGameConfig(): Promise<{ exchangeRate: number; tokenSymbol: string; collectibleName: string }> {
    return {
      exchangeRate: 100,           // Must match exchange_rate in .crossramp
      tokenSymbol: 'SDT',          // On-chain token symbol shown in WalletOverlay
      collectibleName: 'SOUL GEM', // In-game collectible name shown in WalletOverlay
    };
  }

  // Award soul gems after defeating dungeon creatures
  async claimSoulgems(amount: number): Promise<{ balance: number }> {
    if (amount <= 0 || amount > 1000) throw new Error('Invalid soul gem amount');
    await $asset.mint('soulgem', amount);
    const balance = await $asset.get('soulgem');
    return { balance };
  }

  // Get current soul gem balance
  async getSoulgemBalance(): Promise<{ balance: number }> {
    const balance = await $asset.get('soulgem');
    return { balance };
  }

  // Save high score
  async saveHighScore(score: number, wave: number): Promise<{ isNewBest: boolean; bestScore: number }> {
    if (typeof score !== 'number' || score < 0) throw new Error('Invalid score');
    const myState = await $global.getMyState();
    const currentBest = myState.bestScore || 0;
    const isNewBest = score > currentBest;
    if (isNewBest) {
      await $global.updateMyState({ bestScore: score, bestFloor: wave });
    }
    // Update leaderboard
    const existing = await $global.getCollectionItems('leaderboard', {
      filters: [{ field: 'account', operator: '==', value: $sender.account }],
      limit: 1
    });
    if (existing.length > 0) {
      if (isNewBest) {
        await $global.updateCollectionItem('leaderboard', { __id: existing[0].__id, account: $sender.account, score, floor: wave });
      }
    } else {
      await $global.addCollectionItem('leaderboard', { account: $sender.account, score, floor: wave });
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
  async getPlayerStats(): Promise<{ bestScore: number; bestFloor: number; soulgems: number }> {
    const myState = await $global.getMyState();
    const soulgems = await $asset.get('soulgem');
    return {
      bestScore: myState.bestScore || 0,
      bestFloor: myState.bestFloor || 0,
      soulgems
    };
  }
}
