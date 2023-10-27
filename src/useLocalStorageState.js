import { useState, useEffect } from "react";
const useLocalStorageState = (initialState, key) => {
  const [value, setValue] = useState(() => {
    const data = localStorage.getItem("watched");
    return data ? JSON.parse(data) : initialState;
  }); //useState hook also accepts a callback function as a parameter and simply sets the initial value of the state to the value that was returned from the function. This function will be executed once at the inital render and is ignored at re-renders
  //if there is some data in local storage return that data, else return initial state which is an empty array. Map method will not work on null if there was no data in the local storage
  useEffect(() => {
    localStorage.setItem("watched", JSON.stringify(value));
  }, [value, key]); //advantage of using useEffect hook to store data in local storage is that whenever the data that we passed in to the hook changes the local storage will be updated automatically
  return [value, setValue];
};
export default useLocalStorageState;
