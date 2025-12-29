/* eslint-disable @typescript-eslint/no-explicit-any */
import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';

// Block interface extended with faculty info
export interface Block {
  block_id: number;
  block_name: string;
  block_code: string;
  description?: string;
  building_name?: string;
  location?: string;
  status?: string;
  faculity_id?: number;
  faculity_name?: string;
  floor_count?: number;
  room_count?: number;
}

export interface Room {
  block_code: string;
  room_id: number;
  room_number: string;
  room_name?: string;
  room_type: string;
  capacity?: number;
  facilities: string[];
  is_available: boolean;
  floor_number?: number;
  block_name?: string;
  block_id?: number;
}

// Interface for creating/updating rooms (without auto-generated and joined fields)
export interface RoomFormData {
  block_id: number;
  room_number: string;
  room_name?: string;
  room_type: string;
  capacity?: number;
  facilities: string[];
  is_available: boolean;
}

interface RoomState {
  blocks: Block[];
  rooms: Room[];
  loading: boolean;
  error: string | null;
  successMessage: string | null;
  facultyBlocks: Block[]; // Blocks assigned to a specific faculty
}

const initialState: RoomState = {
  blocks: [],
  rooms: [],
  loading: false,
  error: null,
  successMessage: null,
  facultyBlocks: [],
};

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

// ================ EXISTING ROOM & BLOCK FUNCTIONS ================

// Async Thunks
export const fetchBlocks = createAsyncThunk(
  'rooms/fetchBlocks',
  async () => {
    const response = await fetch(`${API_URL}/api/blocks`);
    if (!response.ok) throw new Error('Failed to fetch blocks');
    return response.json();
  }
);

export const fetchFloors = createAsyncThunk(
  'rooms/fetchFloors',
  async (blockId?: number) => {
    console.log('Fetching floors with blockId:', blockId);
    
    let url = `${API_URL}/api/floors`;
    if (blockId) {
      url += `?block_id=${blockId}`;
    }
    
    console.log('Fetching from URL:', url);
    
    const response = await fetch(url);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Failed to fetch floors. Status:', response.status, 'Response:', errorText);
      throw new Error(`Failed to fetch floors: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log('Fetched floors data:', data);
    return data;
  }
);

export const fetchRooms = createAsyncThunk(
  'rooms/fetchRooms',
  async (filters?: { blockId?: number;}) => {
    const params = new URLSearchParams();
    if (filters?.blockId) params.append('block_id', filters.blockId.toString());
    
    const url = `${API_URL}/api/rooms?${params.toString()}`;
    console.log('Fetching rooms from URL:', url);
    
    const response = await fetch(url);
    console.log('Response status:', response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Failed to fetch rooms. Status:', response.status, 'Response:', errorText);
      throw new Error(`Failed to fetch rooms: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log('Rooms data received:', data);
    return data;
  }
);
export const fetchRoomsWithDepBlocks = createAsyncThunk(
  'rooms/fetchRooms',
  async (filters?: { blockId?: number;}) => {
    const params = new URLSearchParams();
    if (filters?.blockId) params.append('block_id', filters.blockId.toString());
    
    const url = `${API_URL}/api/rooms?${params.toString()}`;
    console.log('Fetching rooms from URL:', url);
    
    const response = await fetch(url);
    console.log('Response status:', response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Failed to fetch rooms. Status:', response.status, 'Response:', errorText);
      throw new Error(`Failed to fetch rooms: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log('Rooms data received:', data);
    return data;
  }
);


export const addBlock = createAsyncThunk(
  'rooms/addBlock',
  async (blockData: Omit<Block, 'block_id'>) => {
    const response = await fetch(`${API_URL}/api/blocks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(blockData),
    });
   if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to add block');
    }
    return response.json();
  }
);

export const updateBlock = createAsyncThunk(
  'rooms/updateBlock',
  
  async ({ blockId, blockData }: { blockId: number; blockData: Partial<Block> }) => {
    console.log('Updating block with ID:', blockId);
    
    if (!blockId || isNaN(blockId)) {
      throw new Error('Invalid block ID');
    }

    const response = await fetch(`${API_URL}/api/blocks/${blockId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(blockData),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to update block');
    }
    
    return response.json();
  }
);

export const deleteBlock = createAsyncThunk(
  'rooms/deleteBlock',
  async (blockId: number) => {
    console.log('Deleting block with ID:', blockId);
    
    if (!blockId || isNaN(blockId)) {
      throw new Error('Invalid block ID');
    }

    const response = await fetch(`${API_URL}/api/blocks/${blockId}`, {
      method: 'DELETE',
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to delete block');
    }
    
    return { blockId };
  }
);

// FIXED: Use RoomFormData instead of Omit<Room, 'room_id'>
export const addRoom = createAsyncThunk(
  'rooms/addRoom',
  async (roomData: RoomFormData) => {
    const response = await fetch(`${API_URL}/api/rooms`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(roomData),
    });
if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to add room ');
      }    return response.json();
  }
);

// FIXED: Use Partial<RoomFormData> for updates instead of Partial<Room>
export const updateRoom = createAsyncThunk(
  'rooms/updateRoom',
  async ({ roomId, roomData }: { roomId: number; roomData: Partial<RoomFormData> }) => {
    const response = await fetch(`${API_URL}/api/rooms/${roomId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(roomData),
    });
   if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update room');
    }
     return response.json();
  }
);

export const deleteRoom = createAsyncThunk(
  'rooms/deleteRoom',
  async (roomId: number) => {
    console.log('Deleting room with ID:', roomId);
    
    if (!roomId || isNaN(roomId)) {
      throw new Error('Invalid room ID');
    }

    const response = await fetch(`${API_URL}/api/rooms/${roomId}`, {
      method: 'DELETE',
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to delete room');
    }
    
    return { roomId };
  }
);

// Get blocks assigned to a specific faculty
export const fetchFacultyBlocks = createAsyncThunk(
  'rooms/fetchFacultyBlocks',
  async (facultyId: number, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_URL}/api/faculties/${facultyId}/blocks`);
      if (!response.ok) throw new Error('Failed to fetch faculty blocks');
      const data = await response.json();
      return data;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

// Assign multiple blocks to a faculty
export const assignBlocksToFaculty = createAsyncThunk(
  'rooms/assignBlocksToFaculty',
  async (
    { facultyId, blockIds, status = 'active' }: 
    { facultyId: number; blockIds: number[]; status?: string },
    { rejectWithValue }
  ) => {
    try {
      const response = await fetch(`${API_URL}/api/faculties/${facultyId}/blocks`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          block_ids: blockIds,
          status
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to assign blocks');
      }

      const data = await response.json();
      return { facultyId, blockIds, data };
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

// Remove a block from faculty
export const removeBlockFromFaculty = createAsyncThunk(
  'rooms/removeBlockFromFaculty',
  async (
    { facultyId, blockId }: 
    { facultyId: number; blockId: number },
    { rejectWithValue }
  ) => {
    try {
      const response = await fetch(`${API_URL}/api/faculties/${facultyId}/blocks/${blockId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to remove block');
      }

      return { facultyId, blockId };
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

// Get all blocks with faculty info
export const fetchAllBlocksWithFaculty = createAsyncThunk(
  'rooms/fetchAllBlocksWithFaculty',
  async (_, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_URL}/api/blocks/with-faculty`);
      if (!response.ok) throw new Error('Failed to fetch blocks with faculty info');
      const data = await response.json();
      return data;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);
// Add this to your roomsSlice async thunks
export const assignRoomToDepartment = createAsyncThunk(
  'rooms/assignRoomToDepartment',
  async (
    { departmentId, roomId, status = 'active' }: 
    { departmentId: number; roomId: number[]; status?: string },
    { rejectWithValue }
  ) => {
    try {
      const response = await fetch(`${API_URL}/api/departments/${departmentId}/rooms`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          room_id: roomId,
          status
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to assign room to department');
      }

      return response.json();
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);
// Add these to your roomsSlice async thunks
export const fetchDepartmentRooms = createAsyncThunk(
  'rooms/fetchDepartmentRooms',
  async (departmentId: number, { rejectWithValue }) => {
    try {
      console.log(`Fetching rooms for department ID: ${departmentId}`);
      console.log(`Request URL: ${API_URL}/api/departments/${departmentId}/rooms`);
      
      const response = await fetch(`${API_URL}/api/departments/${departmentId}/rooms`);
      
      console.log(`Response status: ${response.status}`);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Error response: ${errorText}`);
        
        // Try to parse as JSON if possible
        let errorData;
        try {
          errorData = await response.json();
        } catch {
          errorData = { message: errorText };
        }
        
        throw new Error(errorData.message || errorData.error || `Failed to fetch department rooms: ${response.status}`);
      }
      
      const data = await response.json();
      console.log(`Successfully fetched ${data.length} rooms`);
      return data;
    } catch (error: any) {
      console.error('Error in fetchDepartmentRooms:', error);
      return rejectWithValue(error.message);
    }
  }
);

export const removeRoomFromDepartment = createAsyncThunk(
  'rooms/removeRoomFromDepartment',
  async (
    { departmentId, roomId }: 
    { departmentId: number; roomId: number },
    { rejectWithValue }
  ) => {
    try {
      const response = await fetch(`${API_URL}/api/departments/${departmentId}/rooms/${roomId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to remove room from department');
      }

      return { departmentId, roomId };
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

const roomSlice = createSlice({
  name: 'rooms',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearSuccessMessage: (state) => {
      state.successMessage = null;
    },
    resetFacultyBlocks: (state) => {
      state.facultyBlocks = [];
    },
  },
  extraReducers: (builder) => {
    builder
      // ================ EXISTING REDUCERS ================
      // Fetch blocks
      .addCase(fetchBlocks.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchBlocks.fulfilled, (state, action: PayloadAction<Block[]>) => {
        state.loading = false;
        state.blocks = action.payload;
      })
      .addCase(fetchBlocks.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch blocks';
      })
      
      // Fetch floors
      .addCase(fetchFloors.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchFloors.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(fetchFloors.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch floors';
      })
      
      // Fetch rooms
      .addCase(fetchRooms.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchRooms.fulfilled, (state, action: PayloadAction<Room[]>) => {
        state.loading = false;
        state.rooms = action.payload;
        state.error = null;
        console.log('Rooms set in state:', action.payload.length);
      })
      .addCase(fetchRooms.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch rooms';
      })
      
      // Add block
      .addCase(addBlock.fulfilled, (state, action: PayloadAction<Block>) => {
        state.blocks.push(action.payload);
        state.successMessage = 'Block added successfully';
      })
      .addCase(addBlock.rejected, (state, action) => {
        state.error = action.error.message || 'Failed to add block';
      })
      // Add these to your roomsSlice extraReducers
.addCase(fetchDepartmentRooms.pending, (state) => {
  state.loading = true;
  state.error = null;
})
.addCase(fetchDepartmentRooms.fulfilled, (state, action: PayloadAction<DepartmentRoom[]>) => {
  state.loading = false;
})
.addCase(fetchDepartmentRooms.rejected, (state, action) => {
  state.loading = false;
  state.error = action.payload as string;
})

.addCase(removeRoomFromDepartment.fulfilled, (state, action: PayloadAction<{ departmentId: number; roomId: number }>) => {
  state.loading = false;
  state.successMessage = 'Room removed from department successfully';
})
.addCase(removeRoomFromDepartment.rejected, (state, action) => {
  state.loading = false;
  state.error = action.payload as string;
})
      
      // Update block
      .addCase(updateBlock.fulfilled, (state, action: PayloadAction<Block>) => {
        const updatedBlock = action.payload;
        const index = state.blocks.findIndex(block => block.block_id === updatedBlock.block_id);
        if (index !== -1) {
          state.blocks[index] = updatedBlock;
        }
        state.successMessage = 'Block updated successfully';
      })
      .addCase(updateBlock.rejected, (state, action) => {
        state.error = action.error.message || 'Failed to update block';
      })
      
      // Delete block
      .addCase(deleteBlock.fulfilled, (state, action: PayloadAction<{ blockId: number }>) => {
        state.blocks = state.blocks.filter(block => block.block_id !== action.payload.blockId);
        state.successMessage = 'Block deleted successfully';
      })
      .addCase(deleteBlock.rejected, (state, action) => {
        state.error = action.error.message || 'Failed to delete block';
      })
      
      // Add room
      .addCase(addRoom.fulfilled, (state, action: PayloadAction<Room>) => {
        state.rooms.push(action.payload);
        state.successMessage = 'Room added successfully';
      })
      .addCase(addRoom.rejected, (state, action) => {
        state.error = action.error.message || 'Failed to add room';
      })
      
      // Update room
      .addCase(updateRoom.fulfilled, (state, action: PayloadAction<Room>) => {
        const updatedRoom = action.payload;
        const index = state.rooms.findIndex(room => room.room_id === updatedRoom.room_id);
        if (index !== -1) {
          state.rooms[index] = updatedRoom;
        }
        state.successMessage = 'Room updated successfully';
      })
      .addCase(updateRoom.rejected, (state, action) => {
        state.error = action.error.message || 'Failed to update room';
      })
      
      // Delete room
      .addCase(deleteRoom.fulfilled, (state, action: PayloadAction<{ roomId: number }>) => {
        state.rooms = state.rooms.filter(room => room.room_id !== action.payload.roomId);
        state.successMessage = 'Room deleted successfully';
      })
      .addCase(deleteRoom.rejected, (state, action) => {
        state.error = action.error.message || 'Failed to delete room';
      })

      // ================ NEW BLOCK-FACULTY REDUCERS ================
      // Fetch faculty blocks
      .addCase(fetchFacultyBlocks.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchFacultyBlocks.fulfilled, (state, action: PayloadAction<Block[]>) => {
        state.loading = false;
        state.facultyBlocks = action.payload;
      })
      .addCase(fetchFacultyBlocks.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      // Assign blocks to faculty
      .addCase(assignBlocksToFaculty.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.successMessage = null;
      })
      .addCase(assignBlocksToFaculty.fulfilled, (state, action: PayloadAction<{ facultyId: number; blockIds: number[]; data: any }>) => {
        state.loading = false;
        state.successMessage = `Successfully assigned ${action.payload.blockIds.length} block(s) to faculty`;
      })
      .addCase(assignBlocksToFaculty.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
        state.successMessage = null;
      })

      // Remove block from faculty
      .addCase(removeBlockFromFaculty.pending, (state) => {
        state.loading = true;
        state.successMessage = null;
      })
      .addCase(removeBlockFromFaculty.fulfilled, (state, action: PayloadAction<{ facultyId: number; blockId: number }>) => {
        state.loading = false;
        state.facultyBlocks = state.facultyBlocks.filter(
          block => block.block_id !== action.payload.blockId
        );
        state.successMessage = 'Block removed from faculty';
      })
      .addCase(removeBlockFromFaculty.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
        state.successMessage = null;
      })

      // Fetch all blocks with faculty info
      .addCase(fetchAllBlocksWithFaculty.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAllBlocksWithFaculty.fulfilled, (state, action: PayloadAction<Block[]>) => {
        state.loading = false;
        state.blocks = action.payload;
      })
      .addCase(fetchAllBlocksWithFaculty.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
          // Add this to your roomsSlice extraReducers
    .addCase(assignRoomToDepartment.fulfilled, (state) => {
      state.loading = false;
      state.successMessage = 'Room assigned to department successfully';
    })
    .addCase(assignRoomToDepartment.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });
  },
});

export const { clearError, clearSuccessMessage, resetFacultyBlocks } = roomSlice.actions;
export default roomSlice.reducer;