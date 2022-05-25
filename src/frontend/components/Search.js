export default function Search(props) {    
    const { query, setQuery } = props;
    
    return (
        <div id="container">
            <div id="search">
                <input type="text" placeholder="Search For A Product" value={query} onChange={(e) => setQuery(e.target.value)}/>
                <button id="search-icon" type="submit"/>
            </div>
        </div>
    )
}