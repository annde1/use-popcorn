import { Fragment, useEffect, useRef, useState } from "react";
import StarRating from "./StarRating";
import useMovies from "./useMovies";
import useLocalStorageState from "./useLocalStorageState";
import useKey from "./useKey";

const KEY = "8eedd076";
//Components:
const NavBar = ({ children }) => {
  return <nav className="nav-bar">{children}</nav>;
};

const SearchBar = ({ query, setQuery }) => {
  const inputEl = useRef(null); //initial value of refs for dom elements is usually null. Ref is like using querySelector for elements. They are used to store value that changes across renders but they are remembered across renders but don't trigger re-render for a component
  useEffect(() => {
    const callback = (e) => {
      if (document.activeElement === inputEl.current) return;
      if (e.code === "Enter") {
        inputEl.current.focus();
        setQuery("");
      }
    };
    document.addEventListener("keydown", callback);
    return () => document.addEventListener("keydown", callback);
    //focus function makes the search bar in focus
  }, [setQuery]); //3rd step-> using th ref (on mount in this case). useEffect hook works after the dom has been loaded so it's a perfect place to make usage of it with refs (which get added to the dom element also after the dom loaded). Connecting the reference (ref) with the element below, passing it as prop:
  return (
    <input
      className="search"
      type="text"
      placeholder="Search movies..."
      value={query}
      onChange={(e) => setQuery(e.target.value)}
      ref={inputEl}
    />
  );
};
/*Logo is presententional component */
const Logo = () => {
  return (
    <div className="logo">
      <span role="img">🍿</span>
      <h1>usePopcorn</h1>
    </div>
  );
};

const NumResults = ({ movies }) => {
  if (!movies) {
    return <p className="num-results">Loading...</p>;
  }
  return (
    <p className="num-results">
      Found <strong>{movies.length}</strong> results
    </p>
  );
};
/*Main is structural component */
const Main = ({ children }) => {
  return <main className="main">{children}</main>;
};
const average = (arr) =>
  arr.reduce((acc, cur, i, arr) => acc + cur / arr.length, 0);

/* App is structural component */

export default function App() {
  // const [watched, setWatched] = useState([]);
  const [watched, setWatched] = useLocalStorageState([], "watched"); //extracted to custom hook
  const [query, setQuery] = useState(""); //Lifted this state up because we want to use the query coming from the SearchBar componenent to fetch data here in App component
  //This API call is not allowed in React, because it's producing side effect in the render logic (no side effects allowed).
  const [selectedId, setSelectedId] = useState(null);
  const { movies, isLoading, error } = useMovies(query);
  // fetch(`http://www.omdbapi.com/?apikey=${KEY}&s=interstellar`)
  //   .then((res) => res.json())
  //   .then((data) => setMovies(data.Search)) //This will create infinite loop because the state change will trigger re-render which means that the compnent function will be called again with will lead to fetching agaian and again creating ininite loop and firing tons of requests
  //Also if we will try to update the state from render logic directly then it will cause the same effect of infinite loop, that's why we update state inside event handlers only:
  // setWatched([])
  //        `http://www.omdbapi.com/?apikey=${KEY}&s=${query}`

  const handleSelectedMovie = (id) => {
    setSelectedId((currentId) => (currentId === id ? null : id));
  };
  function handleCloseMovie() {
    setSelectedId(null);
  }
  const handleAddWatched = (movie) => {
    setWatched((watched) => [...watched, movie]);
    //if we want to store the list of watched movies in the local storage we need to make sure we still work with up-to-date state because the setWatched was just updated (state updates are asynchronous)
    // localStorage.setItem("watched", JSON.stringify([...watched, movie]));
  };
  const handleDeleteWatched = (id) => {
    setWatched((watched) => watched.filter((movie) => movie.imdbID !== id));
  };

  return (
    <>
      <NavBar movies={movies}>
        <Logo />
        <SearchBar query={query} setQuery={setQuery} />
        <NumResults movies={movies} />
      </NavBar>

      <Main>
        <Box>
          {isLoading && <Loader />}
          {!isLoading && !error && (
            <MoviesList
              movies={movies}
              handleSelectedMovie={handleSelectedMovie}
            />
          )}
          {error && <ErrorMessage message={error} />}
        </Box>
        <Box>
          {selectedId ? (
            <MovieDetail
              selectedId={selectedId}
              onCloseMovie={handleCloseMovie}
              onAddWatched={handleAddWatched}
              watched={watched}
            />
          ) : (
            <Fragment>
              <Summary watched={watched} />
              <WatchedMoviesList
                watched={watched}
                onDeleteWatched={handleDeleteWatched}
              />
            </Fragment>
          )}
        </Box>
      </Main>
    </>
  );
}
const Loader = () => {
  return <p className="loader">Loading...</p>;
};
const ErrorMessage = ({ message }) => {
  return (
    <p className="error">
      {" "}
      <span>⛔️</span>
      {message}
    </p>
  );
};
/* Element is explicit prop but still it's preferable to use children props instead (implicit)*/
const Box = ({ children }) => {
  const [isOpen, setIsOpen] = useState(true);
  return (
    <div className="box">
      <button className="btn-toggle" onClick={() => setIsOpen((open) => !open)}>
        {isOpen ? "–" : "+"}
      </button>
      {isOpen && children}
    </div>
  );
};

/*MoviesList is statefull component */
const MoviesList = ({ movies, handleSelectedMovie }) => {
  return (
    <ul className="list list-movies">
      {movies?.map((movie) => (
        <Movie
          movie={movie}
          key={movie.imdbID}
          handleSelectedMovie={handleSelectedMovie}
        />
      ))}
    </ul>
  );
};
/* Movie is stateless or presententional component */
const Movie = ({ movie, handleSelectedMovie }) => {
  return (
    <li key={movie.imdbID} onClick={() => handleSelectedMovie(movie.imdbID)}>
      <img src={movie.Poster} alt={`${movie.Title} poster`} />
      <h3>{movie.Title}</h3>
      <div>
        <p>
          <span>🗓</span>
          <span>{movie.Year}</span>
        </p>
      </div>
    </li>
  );
};
const MovieDetail = ({ selectedId, onCloseMovie, onAddWatched, watched }) => {
  const [movie, setMovie] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [userRating, setUserRating] = useState("");

  const countRef = useRef(0);

  useEffect(() => {
    if (userRating) countRef.current = countRef.current + 1;
  }, [userRating]); //we're using useEffect hook to update the current property of countRef because updating ref directly in the render logc is forbidden

  const isWatched = watched.map((movie) => movie.imdbID).includes(selectedId);
  const watchedUserRating = watched.find(
    (movie) => movie.imdbID === selectedId
  )?.userRating;
  const {
    Title: title,
    Year: year,
    Poster: poster,
    Runtime: runtime,
    imdbRating,
    Plot: plot,
    Released: released,
    Actors: actors,
    Director: director,
    Genre: genre,
  } = movie;
  const handleAdd = () => {
    const newWatchedMovie = {
      imdbID: selectedId,
      title,
      year,
      poster,
      imdbRating: Number(imdbRating),
      runtime: Number(runtime.split(" ").at(0)),
      userRating,
      countRatungDecisions: countRef.current,
    };
    onAddWatched(newWatchedMovie);
    onCloseMovie();
  };

  useKey("Escape", onCloseMovie);

  useEffect(() => {
    const getMovieDetails = async () => {
      setIsLoading(true);
      const result = await fetch(
        `http://www.omdbapi.com/?apikey=${KEY}&i=${selectedId}`
      );
      const data = await result.json();
      setMovie(data);
      setIsLoading(false);
    };
    getMovieDetails();
  }, [selectedId]);

  useEffect(() => {
    if (!title) return;
    document.title = `Movie | ${title}`;

    return () => {
      document.title = "usePopcorn";
    };
  }, [title]);
  return (
    <div className="details">
      {isLoading ? (
        <Loader />
      ) : (
        <Fragment>
          <header>
            <button className="btn-back" onClick={onCloseMovie}>
              X
            </button>
            <img src={poster} alt={`Poster pf the ${movie}`} />
            <div className="details-overview">
              <h2>{title}</h2>
              <p>
                {released} &bull; {runtime}
              </p>
              <p>{genre}</p>
              <p>
                <span>⭐️</span>
                {imdbRating} IMDb Rating
              </p>
            </div>
          </header>
          <section>
            <div className="rating">
              {!isWatched ? (
                <>
                  <StarRating
                    maxRating={10}
                    size={24}
                    onSetRating={setUserRating}
                  />
                  {userRating > 0 && (
                    <button className="btn-add" onClick={handleAdd}>
                      + Add to list
                    </button>
                  )}
                </>
              ) : (
                <p>
                  You rated this movie with {watchedUserRating} <span>⭐️</span>
                </p>
              )}
            </div>
            <p>
              <em>{plot}</em>
            </p>
            <p>Starring {actors}</p>
            <p>Directed by {director}</p>
          </section>
        </Fragment>
      )}
    </div>
  );
};
const Summary = ({ watched }) => {
  const avgImdbRating = average(watched.map((movie) => movie.imdbRating));
  const avgUserRating = average(watched.map((movie) => movie.userRating));
  const avgRuntime = average(watched.map((movie) => movie.runtime));
  return (
    <div className="summary">
      <h2>Movies you watched</h2>
      <div>
        <p>
          <span>#️⃣</span>
          <span>{watched.length} movies</span>
        </p>
        <p>
          <span>⭐️</span>
          <span>{avgImdbRating.toFixed(2)}</span>
        </p>
        <p>
          <span>🌟</span>
          <span>{avgUserRating.toFixed(2)}</span>
        </p>
        <p>
          <span>⏳</span>
          <span>{avgRuntime} min</span>
        </p>
      </div>
    </div>
  );
};
const WatchedMoviesList = ({ watched, onDeleteWatched }) => {
  return (
    <ul className="list">
      {watched.map((movie) => (
        <WatchedMovie
          movie={movie}
          key={movie.imdbID}
          onDeleteWatched={onDeleteWatched}
        />
      ))}
    </ul>
  );
};
const WatchedMovie = ({ movie, onDeleteWatched }) => {
  return (
    <li>
      <img src={movie.poster} alt={`${movie.title} poster`} />
      <h3>{movie.title}</h3>
      <div>
        <p>
          <span>⭐️</span>
          <span>{movie.imdbRating}</span>
        </p>
        <p>
          <span>🌟</span>
          <span>{movie.userRating}</span>
        </p>
        <p>
          <span>⏳</span>
          <span>{movie.runtime} min</span>
        </p>
        <button
          className="btn-delete"
          onClick={() => onDeleteWatched(movie.imdbID)}
        >
          X
        </button>
      </div>
    </li>
  );
};
