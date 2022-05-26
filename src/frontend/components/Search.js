import { useEffect } from 'react'
import axios from 'axios';

export default function Search(props) {    
    const { query, setQuery, address, postalCode } = props;

    const [guestApiToken, setGuestApiToken] = useState('')

    const register = async () => {
        const { data } = axios.post('/api/register', {address, postalCode})
        setGuestApiToken(data.guestApiToken)
    }

    useEffect(register, [guestApiToken])
    
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