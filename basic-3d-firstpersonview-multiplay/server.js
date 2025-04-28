class Server {
  // Join a room or create a new one if roomId is not provided
  async joinRoom(roomId, nickname) {
    try {
      if (!nickname || nickname.trim() === '') {
        throw new Error('닉네임을 입력해주세요');
      }

      // If roomId is provided, join that specific room
      // Otherwise, create a new room
      const joinedRoomId = await $global.joinRoom(roomId);

      // Initialize user state in the room with the provided nickname
      const userState = {
        account: $sender.account,
        joinedAt: Date.now(),
        lastActive: Date.now(),
        isReady: false,
        nickname: nickname.trim(),
        character: null,
        stats: {
          maxHp: 100,
          currentHp: 100,
        },
      };

      await $room.updateUserState($sender.account, userState);

      // Get current room state
      const roomState = await $room.getRoomState();

      // Initialize room state if it's a new room
      if (!roomState.initialized) {
        await $room.updateRoomState({
          initialized: true,
          lastActivity: Date.now(),
          userCount: (roomState.$users || []).length,
          gameStarted: false,
        });
      } else {
        // Update room state to indicate a new user has joined
        await $room.updateRoomState({
          lastActivity: Date.now(),
          userCount: (roomState.$users || []).length,
        });
      }

      // Broadcast a system message that a new user has joined
      await $room.broadcastToRoom('system-message', {
        type: 'join',
        account: $sender.account,
        nickname: nickname.trim(),
        timestamp: Date.now(),
      });

      return joinedRoomId;
    } catch (error) {
      throw new Error(`방 참여 실패: ${error.message}`);
    }
  }

  // Leave the current room
  async leaveRoom() {
    try {
      // Get user state to include nickname in the system message
      const userState = await $room.getUserState($sender.account);

      // Broadcast a system message that the user is leaving
      await $room.broadcastToRoom('system-message', {
        type: 'leave',
        account: $sender.account,
        nickname: userState.nickname,
        timestamp: Date.now(),
      });

      // Actually leave the room
      return await $global.leaveRoom();
    } catch (error) {
      throw new Error(`방 나가기 실패: ${error.message}`);
    }
  }

  async revive() {
    try {
      // Update user's state
      await $room.updateUserState($sender.account, {
        state: 'IDLE',
        stats: {
          maxHp: 100,
          currentHp: 100,
        },
        lastActive: Date.now(),
      });

      return true;
    } catch (error) {
      console.error(`Failed to update player state: ${error.message}`);
      return false;
    }
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

  async updateMyState(state) {
    return await $room.updateMyState(state);
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

  // Send effect event to all users in the room (generic effect event sending function)
  async sendEffectEvent(type, config) {
    try {
      // Validate effect type
      if (!type) {
        throw new Error('Invalid effect type');
      }

      // Update user's last active timestamp
      await $room.updateUserState($sender.account, {
        lastActive: Date.now(),
      });

      // Broadcast the effect event to all users in the room
      await $room.broadcastToRoom('effect-event', {
        sender: $sender.account,
        type,
        config,
        timestamp: Date.now(),
      });

      return true;
    } catch (error) {
      console.error(`효과 이벤트 전송 실패: ${error.message}`);
      return false;
    }
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

      // Create state update object
      const updateData = {
        stats: {
          ...targetState.stats,
          currentHp: newHp,
        },
        lastActive: Date.now(),
      };

      // If HP is 0 or less, set state to DIE
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
      // If periodic room state updates are needed, add them here
    } catch (error) {
      console.error(`Room tick error: ${error.message}`);
    }
  }
}
