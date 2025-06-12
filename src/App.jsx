import './App.css'
import Search from "./components/Search.jsx";
import {useEffect, useState} from "react";
import Spinner from "./components/Spinner.jsx";
import Papa from 'papaparse';
import MovieCard from './components/MovieCard.jsx';
import {useDebounce} from "react-use";
import {getTrendingMovies, updateSearchCount} from './appwrite.js';

const App = () => {

    const API_BASE_URL = `https://api.themoviedb.org/3`;
    const API_KEY = import.meta.env.VITE_TMDB_API_KEY;
    const API_OPTIONS = {
        method: 'GET',
        headers: {
            accept: 'application/json',
            Authorization: `Bearer ${API_KEY}`
        }
    }

    const [searchTerm, setSearchTerm] = useState('');
    const [debouncedSearchTerm, setdebouncedSearchTerm] = useState('');


    const [movieList, setMovieList] = useState([]);
    const [trendingMovies, setTrendingMovies] = useState([]);

    const [isLoading, setIsLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');

    useDebounce(() => setdebouncedSearchTerm(searchTerm), 800, [searchTerm]);

    // API Key
    const fetchMovies = async (query = '') => {
        setIsLoading(true);
        setErrorMessage('');
        try {
            const endpoint = query
                ? `${API_BASE_URL}/search/movie?query=${encodeURIComponent(query)}`
                : `${API_BASE_URL}/discover/movie?sort_by=popularity.desc`;
            const response = await fetch(endpoint, API_OPTIONS);

            if (!response.ok) {
                throw new Error('Failed to fetch movies');
            }

            const data = await response.json();

            if (data.Response === 'False') {
                setErrorMessage(data.Error || 'No movies found');
                setMovieList([]);
                return;
            }

            setMovieList(data.results || []);

            if (query && data.results.length > 0) {
                await updateSearchCount(query, data.results[0]);
            }

        } catch (e) {
            console.error(e);
            setErrorMessage('Error fetching movies')
        } finally {
            setIsLoading(false);
        }

        await updateSearchCount();
    }

    const loadTrendingMovies = async () => {
        try {
            const movies = await getTrendingMovies();

            setTrendingMovies(movies);
        } catch (e) {
            console.error(`ERROR FETCHING TRENDING MOVIES: ${e}`);

        }
    }

    useEffect(() => {
        fetchMovies(debouncedSearchTerm);
    }, [debouncedSearchTerm]);


    useEffect(() => {
        loadTrendingMovies()
    }, []);

    return (
        <main>

            <div className="pattern"/>
            <div className="wrapper">
                <header>
                    <img src="./hero.png" alt="Hero Banner"/>
                    <h1>
                        Find <span className="text-gradient">Movies</span> You'll Enjoy Without Hassle
                    </h1>
                    <Search searchTerm={searchTerm} setSearchTerm={setSearchTerm}/>
                </header>

                <section className="all-movies">

                    {trendingMovies.length > 0 && (
                        <section className="trending">
                            <h2>Trending Movies</h2>
                            <ul>
                                {trendingMovies.map((movie, index) => (
                                    <li key={movie.$id}>
                                        <p>{index + 1}</p>
                                        <img src={movie.poster_url} alt={movie.title}/>
                                    </li>
                                ))}
                            </ul>
                        </section>
                    )}

                    <h2>All Movies</h2>
                    {isLoading ? (<Spinner/>) : errorMessage ? (<p className={"text-red-500"}>{errorMessage} </p>) : (
                        <ul>{movieList.map((movie) => (
                            <MovieCard key={movie.id} movie={movie}/>
                        ))}</ul>
                    )}
                </section>
            </div>
        </main>
    )
}


export default App
