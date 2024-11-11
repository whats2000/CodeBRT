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
      tourSteps: [
        {
          title: 'Welcome to CodeBRT!',
          description:
            'This is a quick tour to help you get started with CodeBRT.',
        },
      ],
    },
  ],
};

const tourSlice = createSlice({
  name: 'tour',
  initialState,
  reducers: {
    startTourForNewUser(state) {
      // Read the local storage to determine if the user is new
      if (!localStorage.getItem('code-brt.visited')) {
        state.tours.find((tour) => tour.name === 'quickStart')!.tourVisible =
          true;
      }
    },
    // Start a tour
    startTour(state, action: PayloadAction<{ tourName: TourType }>) {
      const tourName = action.payload.tourName;
      state.tours.find((tour) => tour.name === tourName)!.tourVisible = true;
    },
    // End a tour
    endTour(state, action: PayloadAction<{ tourName: TourType }>) {
      const tourName = action.payload.tourName;
      state.tours.find((tour) => tour.name === tourName)!.tourVisible = false;
      localStorage.setItem('code-brt.visited', 'true');
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

export const { startTourForNewUser, startTour, endTour, addRef } =
  tourSlice.actions;

export const tourReducer = tourSlice.reducer;
