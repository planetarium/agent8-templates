class Server {
  // Join a room or create a new one if roomId is not provided
  async joinRoom(roomId, nickname) {
    try {
      if (!nickname || nickname.trim() === '') {
        throw new Error('Please enter a nickname');
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
          cubes: {}, // Initialize cube data - start with empty object
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
      throw new Error(`Failed to join room: ${error.message}`);
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
      throw new Error(`Failed to leave room: ${error.message}`);
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
      throw new Error(`Failed to select character: ${error.message}`);
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
        throw new Error('Please enter a message');
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
      throw new Error(`Failed to send message: ${error.message}`);
    }
  }

  // Send effect event to all users in the room (Generic function for sending effect events)
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
      console.error(`Failed to send effect event: ${error.message}`);
      return false;
    }
  }

  // Send fireball effect event to all users in the room (For backward compatibility)
  async sendFireballEffect(startPosition, direction, targetPosition) {
    // Convert object format to array if needed
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
        throw new Error('Please specify a target user');
      }

      if (!damageAmount || damageAmount <= 0) {
        throw new Error('Please enter a valid damage value');
      }

      // Get attacker info
      const attackerState = await $room.getUserState($sender.account);

      // Get target user state
      const targetState = await $room.getUserState(targetAccount);

      if (!targetState) {
        throw new Error('Target user not found');
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

      // Create status update object
      const updateData = {
        stats: {
          ...targetState.stats,
          currentHp: newHp,
        },
        lastActive: Date.now(),
      };

      // Set state to DIE if HP reaches 0
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
      throw new Error(`Failed to apply damage: ${error.message}`);
    }
  }

  // Get all cubes in the room
  async getCubes() {
    try {
      const roomState = await $room.getRoomState();
      return roomState.cubes || {};
    } catch (error) {
      throw new Error(`Failed to get cubes: ${error.message}`);
    }
  }

  // Add or update a cube at a specific position
  async addCube(position, type) {
    try {
      // Validate position
      if (!position || position.length !== 3) {
        throw new Error('Please provide a valid position');
      }

      // Get current room state with cubes
      const roomState = await $room.getRoomState();
      const cubes = roomState.cubes || {};

      // Create a position key (x,y,z format)
      const posKey = position.join(',');

      // Add or update the cube
      cubes[posKey] = {
        position,
        type,
        createdBy: $sender.account,
        createdAt: Date.now(),
      };

      // Update room state with new cubes
      await $room.updateRoomState({
        cubes,
        lastActivity: Date.now(),
      });

      return {
        success: true,
        position,
        type,
      };
    } catch (error) {
      throw new Error(`Failed to add cube: ${error.message}`);
    }
  }

  // Remove a cube from a specific position
  async removeCube(position) {
    try {
      // Validate position
      if (!position || position.length !== 3) {
        throw new Error('Please provide a valid position');
      }

      // Get current room state with cubes
      const roomState = await $room.getRoomState();
      const cubes = roomState.cubes || {};

      // Create a position key (x,y,z format)
      const posKey = position.join(',');

      // Check if cube exists at this position
      if (!cubes[posKey]) {
        throw new Error('Cube not found at the specified position');
      }

      // Store the cube type before removing
      const removedType = cubes[posKey].type;

      // Remove the cube
      delete cubes[posKey];

      // Update room state with new cubes
      await $room.updateRoomState({
        cubes,
        lastActivity: Date.now(),
      });

      return {
        success: true,
        position,
        removedType,
      };
    } catch (error) {
      throw new Error(`Failed to remove cube: ${error.message}`);
    }
  }

  // Initialize cubes with terrain data
  async initializeCubes(cubes) {
    try {
      // Get current room state
      const roomState = await $room.getRoomState();

      // If cubes are already initialized with some data, ignore this request
      if (roomState.cubes && Object.keys(roomState.cubes).length > 0) {
        return {
          success: false,
          message: 'Cubes are already initialized',
          cubesCount: Object.keys(roomState.cubes).length,
        };
      }

      // Initialize new cubes object
      const newCubes = {};

      // Process all cubes from terrain generation
      cubes.forEach((cube) => {
        const posKey = cube.position.join(',');
        newCubes[posKey] = {
          position: cube.position,
          type: cube.tileIndex,
          createdBy: 'SYSTEM',
          createdAt: Date.now(),
        };
      });

      // Update room state with new cubes
      await $room.updateRoomState({
        cubes: newCubes,
        lastActivity: Date.now(),
      });

      return {
        success: true,
        message: 'Cubes initialized successfully',
        cubesCount: Object.keys(newCubes).length,
      };
    } catch (error) {
      throw new Error(`Failed to initialize cubes: ${error.message}`);
    }
  }
}
