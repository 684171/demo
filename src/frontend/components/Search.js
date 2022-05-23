import { useState } from 'react'

export default function Search() {
    const [query, setQuery] = useState('')
    
    return (
        <div id="container">
            <div id="search">
                <input type="text" placeholder="Search For A Product" value={query} onChange={(e) => setQuery(e.target.value)}/>
                <button type="submit"/>
            </div>
        </div>
    )
}