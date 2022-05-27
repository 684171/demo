import { useEffect, useState } from 'react'
import axios from 'axios';
import SearchItem from './SearchItem'

export default function Search(props) {    
    const { address, postalCode } = props;

    const [query, setQuery] = useState('')
    const [isDisabled, setIsDisabled] = useState(true)
    const [isRegistered, setIsRegistered] = useState(false)
    const [guestApiToken, setGuestApiToken] = useState('')
    const [retailers, setRetailers] = useState([])
    const [items, setItems] = useState([])

    const register = async () => {
        const { data } = await axios.post('/api/register', {address, postalCode})
        setIsRegistered(true)
        setGuestApiToken(data.guestApiToken)
        setRetailers(data.retailers)
        setIsDisabled(false)
    }

    const searchItems = async (e) => {
        e.preventDefault()

        if (!query.length) return
    
        setIsDisabled(true)

        const { data } = await axios.post('/api/search/items', {postalCode, guestApiToken, retailers, query})
        setItems(data.products)

        setIsDisabled(false)
    }

    useEffect(() => {
        if (!isRegistered) register()
    })
    
    return (
        <div id="container">
            <div id="border-shadow-wrapper">
                <fieldset disabled={isDisabled}>
                    <form id="search" onSubmit={searchItems}>
                        <input type="text" placeholder="Search For A Product" value={query} onChange={(e) => setQuery(e.target.value)}/>
                        <button id="search-icon" type="submit"/>
                    </form>
                </fieldset>
            </div>
                {
                    items.length > 0 &&
                    <div id="search-results-box">
                        {
                            items.map(({name, retailerId, image}) =>
                                <SearchItem
                                    key={image}
                                    name={name}
                                    store={retailers.find(({id}) => retailerId === id)}
                                    image={image}
                                />)
                        }
                    </div>
                }
        </div>
    )
}