import { useEffect } from 'react';

const APP_NAME = 'Tiệm bách hoá Hai Tụi Mình';

export const usePageTitle = (title: string) => {
  useEffect(() => {
    document.title = `${title} | ${APP_NAME}`;

    return () => {
      document.title = APP_NAME;
    };
  }, [title]);
};
