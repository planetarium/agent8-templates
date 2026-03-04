export class Server {
  // Award gems after defeating dungeon monsters
  async claimGems(amount: number): Promise<{ balance: number }> {
    if (amount <= 0 || amount > 2000) throw new Error('Invalid gem amount');
    await $asset.mint('gem', amount);
    const balance = await $asset.get('gem');
    return { balance };
  }

  // Get current gem balance
  async getGemBalance(): Promise<{ balance: number }> {
    const balance = await $asset.get('gem');
    return { balance };
  }

  // Save high score
  async saveHighScore(score: number, floor: number): Promise<{ isNewBest: boolean; bestScore: number }> {
    if (typeof score !== 'number' || score < 0) throw new Error('Invalid score');
    const myState = await $global.getMyState();
    const currentBest = myState.bestScore || 0;
    const isNewBest = score > currentBest;
    if (isNewBest) {
      await $global.updateMyState({ bestScore: score, bestFloor: floor });
    }
    const existing = await $global.getCollectionItems('leaderboard', {
      filters: [{ field: 'account', operator: '==', value: $sender.account }],
      limit: 1,
    });
    if (existing.length > 0) {
      if (isNewBest) {
        await $global.updateCollectionItem('leaderboard', {
          __id: existing[0].__id,
          account: $sender.account,
          score,
          floor,
        });
      }
    } else {
      await $global.addCollectionItem('leaderboard', { account: $sender.account, score, floor });
    }
    return { isNewBest, bestScore: isNewBest ? score : currentBest };
  }

  // Get top leaderboard entries
  async getLeaderboard(): Promise<any[]> {
    const items = await $global.getCollectionItems('leaderboard', {
      orderBy: [{ field: 'score', direction: 'desc' }],
      limit: 10,
    });
    return items;
  }

  // Get player stats
  async getPlayerStats(): Promise<{ bestScore: number; bestFloor: number; gems: number }> {
    const myState = await $global.getMyState();
    const gems = await $asset.get('gem');
    return {
      bestScore: myState.bestScore || 0,
      bestFloor: myState.bestFloor || 0,
      gems,
    };
  }
}
