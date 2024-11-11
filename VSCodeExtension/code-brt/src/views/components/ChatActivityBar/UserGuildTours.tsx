import React from 'react';
import { Tour } from 'antd';
import { useDispatch, useSelector } from 'react-redux';

import type { AppDispatch, RootState } from '../../redux';
import { endTour } from '../../redux/slices/tourSlice';

type UserGuildTourProps = {};

export const UserGuildTours: React.FC<UserGuildTourProps> = ({}) => {
  const dispatch = useDispatch<AppDispatch>();
  const tours = useSelector((state: RootState) => state.tour).tours;

  return (
    <>
      {tours.map((tour) => (
        <Tour
          open={tour.tourVisible}
          steps={tour.tourSteps}
          onClose={() => dispatch(endTour({ tourName: tour.name }))}
        />
      ))}
    </>
  );
};
