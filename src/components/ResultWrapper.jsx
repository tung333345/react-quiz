import React from 'react';
import { UserContext } from './content/UserContent';

function ResultWrapper() {
  return (
    <UserContext.Consumer>
      {({ isUserLoggedIn, userId }) => (
        <Result isUserLoggedIn={isUserLoggedIn} userId={userId} />
      )}
    </UserContext.Consumer>
  );
}   

export default ResultWrapper;
