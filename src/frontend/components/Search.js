import { useEffect, useState } from 'react'
import axios from 'axios';

export default function Search(props) {    
    const { query, setQuery, address, postalCode } = props;

    const [isRegistered, setIsRegistered] = useState(false)
    const [guestApiToken, setGuestApiToken] = useState('')
    const [retailers, setRetailers] = useState([])

    const register = async () => {
        const { data } = await axios.post('/api/register', {address, postalCode})
        setIsRegistered(true)
        setGuestApiToken(data.guestApiToken)
        setRetailers(data.retailers)
    }

    useEffect(() => {
        if (!isRegistered) register()
    })
    
    return (
        <div id="container">
            <div id="border-shadow-wrapper">
                <div id="search">
                    <input type="text" placeholder="Search For A Product" value={query} onChange={(e) => setQuery(e.target.value)}/>
                    <button id="search-icon" type="submit"/>
                </div>
            </div>
        </div>
    )
}