/* eslint-disable @typescript-eslint/no-unused-vars */
// src/store/slices/courseBatchSlice.ts
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
// Create a new slice or extend existing one for course-batch specific data
export interface CourseForBatch {
  course_id: number;
  course_code: string;
  course_name: string;
  credits: number;
  semester: number;
  department_id: number;
  department_name: string;
  is_available: boolean;
}


export interface CourseBatch {
  id: number;
  course_id: number;
  batch: number;
  semester_id: string;
  department_id: number;
  created_at: string;
  updated_at: string;
  course_code?: string;
  course_name?: string;
  department_name?: string;
  semester_name?: string;
  batch_year?: string;
}

export interface CourseBatchFormData {
  course_id: number;
  batch: number;
  semester_id: string;
  department_id: number;
}

interface CourseBatchState {
  courseBatches: CourseBatch[];
  loading: boolean;
  error: string | null;
  successMessage: string | null;
}

const initialState: CourseBatchState = {
  courseBatches: [],
  loading: false,
  error: null,
  successMessage: null,
};

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

// Async Thunks
export const fetchCourseBatches = createAsyncThunk(
  'courseBatches/fetchCourseBatches',
  async (_, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_URL}/api/course-batches`);
      if (!response.ok) {
        const errorData = await response.json();
        return rejectWithValue(errorData.error || 'Failed to fetch course batches');
      }
      return await response.json();
    } catch (error) {
      return rejectWithValue('Failed to fetch course batches');
    }
  }
);

export const fetchCourseBatchById = createAsyncThunk(
  'courseBatches/fetchCourseBatchById',
  async (id: number, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_URL}/api/course-batches/${id}`);
      if (!response.ok) {
        const errorData = await response.json();
        return rejectWithValue(errorData.error || 'Failed to fetch course batch');
      }
      return await response.json();
    } catch (error) {
      return rejectWithValue('Failed to fetch course batch');
    }
  }
);

export const createCourseBatch = createAsyncThunk(
  'courseBatches/createCourseBatch',
  async (data: CourseBatchFormData, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_URL}/api/course-batches`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        return rejectWithValue(errorData.error || 'Failed to create course batch');
      }
      
      return await response.json();
    } catch (error) {
      return rejectWithValue('Failed to create course batch');
    }
  }
);

export const updateCourseBatch = createAsyncThunk(
  'courseBatches/updateCourseBatch',
  async ({ id, data }: { id: number; data: Partial<CourseBatchFormData> }, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_URL}/api/course-batches/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        return rejectWithValue(errorData.error || 'Failed to update course batch');
      }
      
      return await response.json();
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      return rejectWithValue('Failed to update course batch');
    }
  }
);

export const deleteCourseBatch = createAsyncThunk(
  'courseBatches/deleteCourseBatch',
  async (id: number, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_URL}/api/course-batches/${id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        return rejectWithValue(errorData.error || 'Failed to delete course batch');
      }
      
      return { id };
    } catch (error) {
      return rejectWithValue('Failed to delete course batch');
    }
  }
);
// Add this to your existing courseBatchSlice.ts
export const createMultipleCourseBatches = createAsyncThunk(
  'courseBatches/createMultipleCourseBatches',
  async (assignments: CourseBatchFormData[], { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_URL}/api/course-batches/bulk`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assignments }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        return rejectWithValue(errorData.error || 'Failed to create course batches');
      }
      
      return await response.json();
    } catch (error) {
      return rejectWithValue('Failed to create course batches');
    }
  }
);

const courseBatchSlice = createSlice({
  name: 'courseBatches',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearSuccessMessage: (state) => {
      state.successMessage = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch course batches
      .addCase(fetchCourseBatches.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCourseBatches.fulfilled, (state, action) => {
        state.loading = false;
        state.courseBatches = action.payload.data || [];
        state.error = null;
      })
      .addCase(fetchCourseBatches.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      
      // Create course batch
      .addCase(createCourseBatch.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createCourseBatch.fulfilled, (state, action) => {
        state.loading = false;
        if (action.payload.data) {
          state.courseBatches.push(action.payload.data);
        }
        state.successMessage = 'Course batch created successfully';
        state.error = null;
      })
      .addCase(createCourseBatch.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(createMultipleCourseBatches.pending, (state) => {
          state.loading = true;
          state.error = null;
        })
        .addCase(createMultipleCourseBatches.fulfilled, (state, action) => {
          state.loading = false;
          if (action.payload.results) {
            // Fetch fresh data after bulk creation
            // Or you can add each result individually if needed
          }
          state.successMessage = `Successfully created ${action.payload.created} assignments`;
          state.error = null;
        })
        .addCase(createMultipleCourseBatches.rejected, (state, action) => {
          state.loading = false;
          state.error = action.payload as string;
        })
      // Update course batch
      .addCase(updateCourseBatch.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateCourseBatch.fulfilled, (state, action) => {
        state.loading = false;
        const updated = action.payload.data;
        if (updated) {
          const index = state.courseBatches.findIndex(cb => cb.id === updated.id);
          if (index !== -1) {
            state.courseBatches[index] = updated;
          }
        }
        state.successMessage = 'Course batch updated successfully';
        state.error = null;
      })
      .addCase(updateCourseBatch.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      
      // Delete course batch
      .addCase(deleteCourseBatch.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteCourseBatch.fulfilled, (state, action) => {
        state.loading = false;
        state.courseBatches = state.courseBatches.filter(cb => cb.id !== action.payload.id);
        state.successMessage = 'Course batch deleted successfully';
        state.error = null;
      })
      .addCase(deleteCourseBatch.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearError, clearSuccessMessage } = courseBatchSlice.actions;
export default courseBatchSlice.reducer;