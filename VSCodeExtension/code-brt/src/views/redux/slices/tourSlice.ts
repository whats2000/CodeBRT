import type { WritableDraft } from 'immer';

import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { TourProps, TourStepProps } from 'antd';

type TourType = 'quickStart';
type TourEntry = {
  name: TourType;
  currentStep: number;
  tourVisible: boolean;
  tourSteps: TourProps['steps'];
};

type TourState = {
  tours: TourEntry[];
};

const initialState: TourState = {
  tours: [
    {
      name: 'quickStart',
      currentStep: 0,
      tourVisible: false,
      tourSteps: [],
    },
  ],
};

const tourSlice = createSlice({
  name: 'tour',
  initialState,
  reducers: {
    // Start a tour
    startTour(state, action: PayloadAction<{ tourName: TourType }>) {
      const tourName = action.payload.tourName;
      state.tours.find((tour) => tour.name === tourName)!.tourVisible = true;
    },
    // Move to the next step
    nextStep(state, action: PayloadAction<{ tourName: TourType }>) {
      const tourName = action.payload.tourName;
      state.tours.find((tour) => tour.name === tourName)!.currentStep += 1;
    },
    // Move to the previous step
    previousStep(state, action: PayloadAction<{ tourName: TourType }>) {
      const tourName = action.payload.tourName;
      state.tours.find((tour) => tour.name === tourName)!.currentStep -= 1;
    },
    // End a tour
    endTour(state, action: PayloadAction<{ tourName: TourType }>) {
      const tourName = action.payload.tourName;
      state.tours.find((tour) => tour.name === tourName)!.tourVisible = false;
    },
    // Add a ref to a tour, using the order to determine the target
    addRef(
      state,
      action: PayloadAction<
        {
          tourName: TourType;
          stepIndex: number;
        } & WritableDraft<TourStepProps>
      >,
    ) {
      const { tourName, stepIndex } = action.payload;
      const tour = state.tours.find((tour) => tour.name === tourName);

      if (!tour || !tour.tourSteps) {
        return;
      }

      // If already exists return
      if (tour.tourSteps.find((step) => step.title === action.payload.title)) {
        return;
      }

      tour.tourSteps.splice(stepIndex, 0, {
        ...action.payload,
      });
    },
  },
});

export const { startTour, nextStep, previousStep, endTour, addRef } =
  tourSlice.actions;

export const tourReducer = tourSlice.reducer;
