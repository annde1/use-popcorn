import { useEffect } from "react";
const useKey = (key, callback) => {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.code.toLowerCase() === key.toLowerCase()) {
        callback();
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
    //We remove the event listener because we don't want to have mahy event listeners. When the component unmounts it should remove his event listener
  }, [key, callback]); //to listen for the key down effect we need to use useEffect hook because it's a side effect (we are touching the DOM)
};
export default useKey;
