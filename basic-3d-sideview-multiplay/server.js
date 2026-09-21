class Server {
  // Returns an id for a brand-new room. The room does not exist yet — the runtime
  // creates it when the first client joins with the SDK's joinRoom(). The server
  // never joins rooms in 2.0: $global.joinRoom() has been removed.
  async createRoom() {
    const existingRoomIds = new Set(await $global.getAllRoomIds());

    let roomId = 'Room' + Math.random().toString(16).substring(2, 10);
    while (existingRoomIds.has(roomId)) {
      roomId = 'Room' + Math.random().toString(16).substring(2, 10);
    }

    return roomId;
  }

  // Stores the nickname on the caller's global user state. onRoomJoin reads it back
  // from there to seed the room user state, so the client calls this before joinRoom().
  async setNickname(nickname) {
    if (typeof nickname !== 'string' || nickname.trim() === '') {
      throw new Error('닉네임을 입력해주세요');
    }

    const trimmed = nickname.trim();
    await $global.updateMyState({ nickname: trimmed });

    return trimmed;
  }

  // Runs once, when the first user joins and the room is created. Only fields that
  // onRoomJoin never writes may be seeded here: room hooks are not serialized, so a
  // second user's onRoomJoin can land before this hook runs and a blind overwrite
  // would erase them.
  async onRoomCreate(roomId) {
    await $room.updateRoomState({
      initialized: true,
      createdAt: Date.now(),
      gameStarted: false,
    });
  }

  // Runs for every user entering the room. Seeding room user state belongs here now
  // that the client, not the server, drives joining.
  async onRoomJoin(roomId, account) {
    // The nickname the client stored with setNickname() before joining.
    const globalUserState = await $global.getUserState(account);
    const nickname = globalUserState.nickname || 'Player';

    // Room user state outlives a leave while the room is still alive, so a rejoining
    // user would otherwise come back carrying their previous match's values.
    await $room.clearUserState(account);
    await $room.updateUserState(account, {
      account,
      joinedAt: Date.now(),
      lastActive: Date.now(),
      isReady: false,
      nickname,
      character: null,
      stats: {
        maxHp: 100,
        currentHp: 100,
      },
    });

    // Broadcast a system message that a new user has joined
    await $room.broadcastToRoom('system-message', {
      type: 'join',
      account,
      nickname,
      timestamp: Date.now(),
    });
  }

  // Runs on every exit, and is the only hook that does. A closed tab fires it at
  // once; an explicit leaveRoom() or a dropped connection fires it after the
  // runtime's 30s grace period, during which the user is still in $users.
  async onRoomLeave(roomId, account) {
    const userState = await $room.getUserState(account);

    // Broadcast a system message that the user has left
    await $room.broadcastToRoom('system-message', {
      type: 'leave',
      account,
      nickname: userState.nickname,
      timestamp: Date.now(),
    });
  }

  // Set character for the current user
  async setCharacter(character) {
    try {
      // Update user's character
      await $room.updateUserState($sender.account, {
        character,
        lastActive: Date.now(),
      });

      // Broadcast a system message that user has selected a character
      await $room.broadcastToRoom('system-message', {
        type: 'character-select',
        account: $sender.account,
        character: character,
        timestamp: Date.now(),
      });

      return character;
    } catch (error) {
      throw new Error(`캐릭터 선택 실패: ${error.message}`);
    }
  }

  // Update player transform and state
  async updatePlayerTransform(transform, state) {
    try {
      // Validate transform data
      if (!transform || !transform.position || !transform.rotation) {
        throw new Error('Invalid transform data');
      }

      // Get the current user state (optional)
      // const userState = await $room.getUserState($sender.account);

      // Update user's transform (original object) and state
      await $room.updateUserState($sender.account, {
        transform: transform, // Use the original transform object
        state,
        lastActive: Date.now(),
      });

      return true;
    } catch (error) {
      console.error(`Failed to update player transform: ${error.message}`);
      return false;
    }
  }

  // Toggle ready status for the current user
  async toggleReady() {
    try {
      // Get current user state
      const userState = await $room.getUserState($sender.account);

      // Don't allow toggling ready if not character is selected
      if (!userState.character) {
        throw new Error('Please select a character first');
      }

      // Toggle ready status
      const newReadyStatus = !userState.isReady;

      // Update user's ready status
      await $room.updateUserState($sender.account, {
        isReady: newReadyStatus,
        lastActive: Date.now(),
      });

      // Get current room state
      const roomState = await $room.getRoomState();

      if (newReadyStatus) {
        // If the user is now ready
        if (!roomState.gameStarted) {
          // If game hasn't started yet and this is the first ready user, start the game
          const now = Date.now();
          await $room.updateRoomState({
            gameStarted: true,
            gameStartTime: now,
            lastActivity: now,
          });

          // Broadcast game start message
          await $room.broadcastToRoom('system-message', {
            type: 'game-start',
            timestamp: now,
            message: 'Game started!',
          });
        } else {
          // If game is already started, player joins immediately
          await $room.broadcastToRoom('system-message', {
            type: 'player-join-game',
            account: $sender.account,
            nickname: userState.nickname,
            timestamp: Date.now(),
            message: `${userState.nickname} joined the game!`,
          });
        }
      }

      return newReadyStatus;
    } catch (error) {
      throw new Error(`Failed to change ready status: ${error.message}`);
    }
  }

  // Send a chat message to everyone in the room
  async sendMessage(message) {
    try {
      if (!message || message.trim() === '') {
        throw new Error('메시지를 입력해주세요');
      }

      // Get user state to include nickname in the message
      const userState = await $room.getUserState($sender.account);

      // Update user's last active timestamp
      await $room.updateUserState($sender.account, {
        lastActive: Date.now(),
      });

      // Broadcast the message to all users in the room
      await $room.broadcastToRoom('chat-message', {
        sender: $sender.account,
        senderNickname: userState.nickname || null,
        content: message,
        timestamp: Date.now(),
      });

      return true;
    } catch (error) {
      throw new Error(`메시지 전송 실패: ${error.message}`);
    }
  }

  // Send effect event to all users in the room (범용적인 효과 이벤트 전송 함수)
  async sendEffectEvent(effectData) {
    try {
      // Get user state to include sender information
      const userState = await $room.getUserState($sender.account);

      // Validate effect data
      if (!effectData || !effectData.type || !effectData.startPosition || !effectData.direction || !effectData.targetPosition) {
        throw new Error('Invalid effect data');
      }

      // Update user's last active timestamp
      await $room.updateUserState($sender.account, {
        lastActive: Date.now(),
      });

      // Broadcast the effect event to all users in the room
      await $room.broadcastToRoom('effect-event', {
        sender: $sender.account,
        effectData,
        timestamp: Date.now(),
      });

      return true;
    } catch (error) {
      console.error(`효과 이벤트 전송 실패: ${error.message}`);
      return false;
    }
  }

  // Send fireball effect event to all users in the room (이전 버전 호환성 유지용)
  async sendFireballEffect(startPosition, direction, targetPosition) {
    // 객체 형태로 들어올 경우 배열로 변환
    const convertToArray = (pos) => {
      if (Array.isArray(pos)) return pos;
      return [pos.x, pos.y, pos.z];
    };

    return this.sendEffectEvent({
      type: 'FIREBALL',
      startPosition: convertToArray(startPosition),
      direction: convertToArray(direction),
      targetPosition: convertToArray(targetPosition),
    });
  }

  // Handle ping request from client for RTT calculation
  async handlePing(clientPingTime) {
    try {
      const serverPongTime = Date.now(); // Get high-resolution timestamp
      // console.log(`Received ping with clientTime: ${clientPingTime}, sending pong at: ${serverPongTime}`);
      return {
        clientPingTime, // Echo back the client's ping time
        serverPongTime, // Send the server's pong time
      };
    } catch (error) {
      console.error(`handlePing Error: ${error.message}`);
      // In case of an error, return null or throw, depending on desired client handling
      return {
        clientPingTime: null, // Echo back the client's ping time
        serverPongTime, // Send the server's pong time
      };
    }
  }

  // Apply damage to a target user
  async applyDamage(targetAccount, damageAmount) {
    try {
      if (!targetAccount) {
        throw new Error('대상 사용자를 지정해주세요');
      }

      if (!damageAmount || damageAmount <= 0) {
        throw new Error('유효한 데미지 값을 입력해주세요');
      }

      // Get attacker info
      const attackerState = await $room.getUserState($sender.account);

      // Get target user state
      const targetState = await $room.getUserState(targetAccount);

      if (!targetState) {
        throw new Error('대상 사용자를 찾을 수 없습니다');
      }

      // Initialize stats if they don't exist
      if (!targetState.stats) {
        targetState.stats = { maxHp: 100, currentHp: 100 };
      } else if (targetState.stats.currentHp === undefined) {
        targetState.stats.maxHp = 100;
        targetState.stats.currentHp = 100;
      }

      // Calculate new HP
      const newHp = Math.max(0, targetState.stats.currentHp - damageAmount);

      // 상태 업데이트 객체 생성
      const updateData = {
        stats: {
          ...targetState.stats,
          currentHp: newHp,
        },
        lastActive: Date.now(),
      };

      // HP가 0이 되면 state를 DIE로 설정
      if (newHp <= 0) {
        updateData.state = 'DIE';
      }

      // Update target's HP and state if died
      await $room.updateUserState(targetAccount, updateData);

      return {
        success: true,
        targetAccount,
        newHp,
      };
    } catch (error) {
      throw new Error(`데미지 적용 실패: ${error.message}`);
    }
  }

  // Room tick function to handle periodic updates
  async $roomTick(deltaMS, roomId) {
    try {
      // 주기적인 룸 상태 업데이트가 필요한 경우 여기에 추가
    } catch (error) {
      console.error(`Room tick error: ${error.message}`);
    }
  }
}
