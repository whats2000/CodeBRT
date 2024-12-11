import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { TourStepProps } from 'antd';

type TourType = 'quickStart';
type TourEntry = {
  name: TourType;
  currentStep: number;
  tourVisible: boolean;
  tourSteps: (Omit<TourStepProps, 'target'> & { targetId?: string })[];
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
        'welcomeMessage',
        'uploadFiles',
        'recordVoice',
        'textInput',
        'activateTools',
        'advanceSettings',
        'fileSynchronization',
        'serviceProvider',
        'modelList',
        'settings',
      ].map((title) => ({
        title: `${title}.title`,
        description: `${title}.description`,
      })),
    },
  ],
};

const tourSlice = createSlice({
  name: 'tour',
  initialState,
  reducers: {
    startTourForNewUser(state) {
      if (!localStorage.getItem('code-brt.visited')) {
        state.tours.find((tour) => tour.name === 'quickStart')!.tourVisible =
          true;
      }
    },
    startTour(state, action: PayloadAction<{ tourName: TourType }>) {
      const tourName = action.payload.tourName;
      state.tours.find((tour) => tour.name === tourName)!.tourVisible = true;
    },
    endTour(state, action: PayloadAction<{ tourName: TourType }>) {
      const tourName = action.payload.tourName;
      state.tours.find((tour) => tour.name === tourName)!.tourVisible = false;
      localStorage.setItem('code-brt.visited', 'true');
    },
    setRefId(
      state,
      action: PayloadAction<{
        tourName: TourType;
        stepIndex: number;
        targetId: string;
      }>,
    ) {
      const { tourName, stepIndex, targetId } = action.payload;
      const tour = state.tours.find((tour) => tour.name === tourName);
      if (tour && tour.tourSteps) {
        const tourStep = tour.tourSteps[stepIndex];
        tourStep.targetId = targetId;
      }
    },
  },
});

export const { startTourForNewUser, startTour, endTour, setRefId } =
  tourSlice.actions;

export const tourReducer = tourSlice.reducer;
