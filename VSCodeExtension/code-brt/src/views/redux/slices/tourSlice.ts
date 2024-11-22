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
        {
          title: 'Welcome to CodeBRT!',
          description:
            'This is a quick tour to help you get started with CodeBRT.',
        },
        {
          title: 'Upload Files',
          description: 'Upload images. (Multiple images are supported)',
        },
        {
          title: 'Record Voice',
          description: 'Record your voice. And convert it to text.',
        },
        {
          title: 'Text Input',
          description:
            'Write your message or Paste images from clipboard. ' +
            'You can also drag and drop images with Shift key pressed (Required by VSCode)',
        },
        {
          title: 'Activate Tools',
          description:
            'This can toggle to let the large language model to perform various tasks. ' +
            'Such as web search, URL fetching, and control your IDE with agent tools. ' +
            'Enable the tools you need to use.',
        },
        {
          title: 'Advance Settings of the Model',
          description:
            'Here contain System Prompt, Temperature, Max Tokens and more.',
        },
        {
          title: 'File Synchronization To History',
          description:
            'To prevent the model confidentiality overwrite human edited content. ' +
            'This feature will synchronize current file status to history. ' +
            'Use after manually editing the file.',
        },
        {
          title: 'Service Provider',
          description:
            'We support multiple model services. You can switch the provider here.',
        },
        {
          title: 'Model List',
          description:
            'There is an edit model list button at the end of the model list. ' +
            'Which can let you edit or update the model list for the latest models.',
        },
        {
          title: 'Settings',
          description:
            'Before you start, you should set up the API key or Host the server. ' +
            'Check the "General Settings" first for get the API key or setup for the local server.',
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
