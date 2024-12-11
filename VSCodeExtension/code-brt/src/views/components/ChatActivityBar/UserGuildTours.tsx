import React from 'react';
import { Tour, TourStepProps } from 'antd';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';

import type { AppDispatch, RootState } from '../../redux';
import { endTour } from '../../redux/slices/tourSlice';
import { useRefs } from '../../context/RefContext';

type UserGuildTourProps = {};

export const UserGuildTours: React.FC<UserGuildTourProps> = ({}) => {
  const { getRefById } = useRefs();
  const { t } = useTranslation('userGuildTours');

  const dispatch = useDispatch<AppDispatch>();
  const tours = useSelector((state: RootState) => state.tour).tours;

  const mapTourStepsToAntdTourSteps = (
    tourSteps: (Omit<TourStepProps, 'target'> & { targetId?: string })[],
  ) => {
    return tourSteps.map((step, index) => {
      const target = step.targetId ? getRefById(step.targetId) : null;
      const { title, description } = step;
      return {
        ...step,
        title: t(title),
        description: t(description),
        target: target?.current,
        prevButtonProps: {
          ...step.prevButtonProps,
          children: t('common:previous'),
        },
        nextButtonProps: {
          ...step.nextButtonProps,
          children:
            index === tourSteps.length - 1
              ? t('common:finish')
              : t('common:next'),
        },
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
