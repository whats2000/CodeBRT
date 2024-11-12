import React from 'react';
import { Tour, TourStepProps } from 'antd';
import { useDispatch, useSelector } from 'react-redux';

import type { AppDispatch, RootState } from '../../redux';
import { endTour } from '../../redux/slices/tourSlice';
import { useRefs } from '../../context/RefContext';

type UserGuildTourProps = {};

export const UserGuildTours: React.FC<UserGuildTourProps> = ({}) => {
  const { getRefById } = useRefs();

  const dispatch = useDispatch<AppDispatch>();
  const tours = useSelector((state: RootState) => state.tour).tours;

  const mapTourStepsToAntdTourSteps = (
    tourSteps: (Omit<TourStepProps, 'target'> & { targetId?: string })[],
  ) => {
    return tourSteps.map((step) => {
      const target = step.targetId ? getRefById(step.targetId) : null;
      return {
        ...step,
        target: target?.current,
      } as TourStepProps;
    });
  };

  return (
    <>
      {tours.map((tour) => (
        <Tour
          key={tour.name}
          open={tour.tourVisible}
          steps={mapTourStepsToAntdTourSteps(tour.tourSteps)}
          onClose={() => dispatch(endTour({ tourName: tour.name }))}
        />
      ))}
    </>
  );
};
