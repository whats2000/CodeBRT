import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit';

import type { RootState } from '../store';
import type { CallAPI } from '../../WebviewContext';
import { UPLOADED_FILES_KEY } from '../../../constants';

type FileUploadState = {
  uploadedFiles: string[];
  isUploading: boolean;
  error: string | null;
};

const initialState: FileUploadState = {
  uploadedFiles: JSON.parse(localStorage.getItem(UPLOADED_FILES_KEY) || '[]'),
  isUploading: false,
  error: null,
};

export const handleFilesUpload = createAsyncThunk<
  void,
  FileList,
  {
    state: RootState;
    extra: {
      callApi: CallAPI;
    };
  }
>(
  'fileUpload/handleFilesUpload',
  async (files, { dispatch, extra: { callApi } }) => {
    const fileArray = Array.from(files);

    for (const file of fileArray) {
      const base64Data: string = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          if (reader.result && typeof reader.result === 'string') {
            resolve(reader.result);
          } else {
            reject(new Error('Failed to read file.'));
          }
        };
        reader.onerror = () => reject(new Error('Failed to read file.'));
        reader.readAsDataURL(file);
      });

      const uploadedFileName = await callApi(
        'uploadFile',
        base64Data,
        file.name,
      );
      dispatch(addUploadedFile(uploadedFileName));
    }
  },
);

export const deleteFile = createAsyncThunk<
  string,
  string,
  {
    state: RootState;
    extra: {
      callApi: CallAPI;
    };
  }
>('fileUpload/deleteFile', async (filePath, { extra: { callApi } }) => {
  await callApi('deleteFile', filePath);
  return filePath;
});

const fileUploadSlice = createSlice({
  name: 'fileUpload',
  initialState,
  reducers: {
    addUploadedFile(state, action: PayloadAction<string>) {
      state.uploadedFiles.push(action.payload);
    },
    clearUploadedFiles(state) {
      state.uploadedFiles = [];
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(handleFilesUpload.pending, (state) => {
        state.isUploading = true;
        state.error = null;
      })
      .addCase(handleFilesUpload.fulfilled, (state) => {
        state.isUploading = false;
      })
      .addCase(handleFilesUpload.rejected, (state, action) => {
        state.isUploading = false;
        state.error = action.error.message || 'Failed to upload files';
      })
      .addCase(deleteFile.fulfilled, (state, action) => {
        state.uploadedFiles = state.uploadedFiles.filter(
          (file) => file !== action.payload,
        );
      });
  },
});

export const { addUploadedFile, clearUploadedFiles } = fileUploadSlice.actions;
export const fileUploadReducer = fileUploadSlice.reducer;
