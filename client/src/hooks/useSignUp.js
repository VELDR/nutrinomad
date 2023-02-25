import { useState } from 'react';
import axios from 'axios';
import { useAuthContext } from './useAuthContext';
import { ACTIONS } from '../context/AuthContext';

export const useSignUp = () => {
  const [errorMessage, setErrorMessage] = useState('');
  const [isError, setIsError] = useState(null);
  const { dispatch } = useAuthContext();

  const signUp = async (
    name,
    email,
    password,
    sex,
    age,
    height,
    weight,
    activityLevel
  ) => {
    setErrorMessage(null);
    setIsError(false);

    try {
      const response = await axios.post('/api/users/signUp', {
        name,
        email,
        password,
        sex,
        age,
        height,
        weight,
        activityLevel,
      });
      const data = await response.data;

      if (response.status === 200) {
        // save user to local storage
        localStorage.setItem('user', JSON.stringify(data));

        // update Auth Context
        dispatch({ type: ACTIONS.SIGNIN, payload: data });
        setIsError(false);
      }
    } catch (err) {
      setIsError(true);
      setErrorMessage(err.response.data.error);
    }
  };

  return [signUp, isError, errorMessage];
};
