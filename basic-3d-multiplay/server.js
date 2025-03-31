class Server {
  // Join a room or create a new one if roomId is not provided
  async joinRoom(roomId, nickname) {
    try {
      if (!nickname || nickname.trim() === "") {
        throw new Error("닉네임을 입력해주세요");
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
      await $room.broadcastToRoom("system-message", {
        type: "join",
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
      await $room.broadcastToRoom("system-message", {
        type: "leave",
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

  // Set character for the current user
  async setCharacter(character) {
    try {
      // Update user's character
      await $room.updateUserState($sender.account, {
        character,
        lastActive: Date.now(),
      });

      // Broadcast a system message that user has selected a character
      await $room.broadcastToRoom("system-message", {
        type: "character-select",
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
        throw new Error("Invalid transform data");
      }

      // Get the current user state
      const userState = await $room.getUserState($sender.account);

      // Update user's transform and state
      await $room.updateUserState($sender.account, {
        transform,
        state,
        lastActive: Date.now(),
      });

      return true;
    } catch (error) {
      console.error(`플레이어 위치 업데이트 실패: ${error.message}`);
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
        throw new Error("Please select a character first");
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
          await $room.broadcastToRoom("system-message", {
            type: "game-start",
            timestamp: now,
            message: "Game started!",
          });
        } else {
          // If game is already started, player joins immediately
          await $room.broadcastToRoom("system-message", {
            type: "player-join-game",
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
      if (!message || message.trim() === "") {
        throw new Error("메시지를 입력해주세요");
      }

      // Get user state to include nickname in the message
      const userState = await $room.getUserState($sender.account);

      // Update user's last active timestamp
      await $room.updateUserState($sender.account, {
        lastActive: Date.now(),
      });

      // Broadcast the message to all users in the room
      await $room.broadcastToRoom("chat-message", {
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

  // Room tick function to handle periodic updates
  async $roomTick(deltaMS, roomId) {
    try {
      // 주기적인 룸 상태 업데이트가 필요한 경우 여기에 추가
    } catch (error) {
      console.error(`Room tick error: ${error.message}`);
    }
  }
}
