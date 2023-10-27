import { useState, useEffect } from "react";

const KEY = "8eedd076";
const useMovies = (query) => {
  const [movies, setMovies] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(""); //If there will be any error coming from the fetchMovies async function it will be stored in error and displayed

  useEffect(() => {
    // callback?.();
    const controller = new AbortController(); //part of browser API, will use in the clean up function. We want only the last request to be the actuall request (not every key press)
    const fetchMovies = async () => {
      try {
        setIsLoading(true);
        setError("");
        const result = await fetch(
          `http://www.omdbapi.com/?apikey=${KEY}&s=${query}`,
          { signal: controller.signal }
        ); //connecting th abort controller with the api call
        if (!result.ok) throw new Error("Something went wrong");
        const data = await result.json();
        if (data.Response === "False") throw new Error("Movie not found");
        setMovies(data.Search);
        setError("");
      } catch (err) {
        if (err.name !== "AbortError") {
          setError(err.message); //Setting the error only if it's not the abort error (cleanup function)
        }
      } finally {
        setIsLoading(false);
      }
    };
    // If the query lenght is smaller than 3 then dont search for movie and treset the movies array and error
    if (query.length < 3) {
      setMovies([]);
      setError("");
      return;
    }
    // handleCloseMovie(); //before we search for a new movie we want to close the MovieDetails component
    fetchMovies();
    //after each re-render this function will be called. This means the controller will abort the current fetch request. The problem is that as soon as a request gets cancelled then js sees it as an error
    return () => {
      controller.abort();
    };
  }, [query]); //by including query in the dependencies array whenever it changes the effect will run again, in our case it means that a new request is gonna be made to the movies API
  //When dependecies array is empty then it means that the side effect should happen only at mount (first render). useEffect hook ensures that the side effect will happen after the initial render, without creating infinite loop.
  return { movies, isLoading, error };
};
export default useMovies;
