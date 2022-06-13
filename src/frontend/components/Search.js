import { useEffect, useState } from 'react'
import axios from 'axios';
import SearchItem from './SearchItem'
import PriceItem from './PriceItem'

export default function Search(props) {
    const { address, postalCode, latitude, longitude } = props;

    const [query, setQuery] = useState('')
    const [searchInputDisabled, setSearchInputDisabled] = useState(true)
    const [isRegistered, setIsRegistered] = useState(false)
    const [guestApiToken, setGuestApiToken] = useState('')
    const [retailers, setRetailers] = useState([])
    const [items, setItems] = useState([])
    const [selectedItems, setSelectedItems] = useState([])
    const [selectDisabled, setSelectDisabled] = useState(false)
    const [searchButtonText, setSearchButtonText] = useState('')
    const [searchButtonDisabled, setSearchButtonDisabled] = useState(false)
    const [prices, setPrices] = useState([])

    const register = async () => {
        const { data } = await axios.post('/api/register', {address, postalCode, latitude, longitude})
        setIsRegistered(true)
        setGuestApiToken(data.guestApiToken)
        setRetailers(data.retailers)
        setSearchInputDisabled(false)
    }

    useEffect(() => {
        console.log(retailers)
    }, [retailers])

    const searchItems = async (e) => {
        e.preventDefault()

        if (!query.length) return
    
        setSearchInputDisabled(true)

        const { data } = await axios.post('/api/search/items', {guestApiToken, retailers, query})

        /**
         * Sort search results by waterfalling between store products, resulting in the best search results from
         * a variety of stores at the top, and worse results at the bottom
         */
        const productsMappedToStores = data.products.reduce((acc, cur) => {
            if (!acc[cur.retailerId]) acc[cur.retailerId] = [cur]
            else acc[cur.retailerId].push(cur)
            return acc
        }, {})
        
        const retailerIds = Object.keys(productsMappedToStores)

        const retailerCounts = Object.keys(productsMappedToStores).reduce((acc, cur) => {
            acc[cur] = {
                products: productsMappedToStores[cur],
                current: 0,
            }
            return acc
        }, {})

        const products = []

        for (let i = 0, j = 0; i < data.products.length; j === retailerIds.length && (j = 0)) {            
            const retailerId = retailerIds[j]
        
            if (retailerCounts[retailerId].current < retailerCounts[retailerId].products.length) {
                const productIndex = retailerCounts[retailerId].current

                products.push(retailerCounts[retailerId].products[productIndex])
                retailerCounts[retailerId].current++
                i++
            }
        
            j++
        }

        setSelectDisabled(false)
        setSelectedItems([])
        setSearchButtonDisabled(true)
        setSearchButtonText(`Select up to (20) items`)
        setItems(products)
        setSearchInputDisabled(false)
    }

    const handleSelectItem = (selected, i) => {
        const items = selectedItems

        if (selected) {
            const index = items.findIndex((index) => index === i)
            items.splice(index, 1)
        } else {
            items.push(i)
        }

        if (items.length >= 20) {
            setSearchButtonText('Search Prices')
            setSelectDisabled(true)
        } else if (items.length === 19) {
            setSearchButtonText('Select up to (1) items')
            setSelectDisabled(false)
        } else if (!items.length) {
            setSearchButtonDisabled(true)
            setSearchButtonText('Select up to (20) items')
        } else if (items.length === 1) {
            setSearchButtonDisabled(false)
            setSearchButtonText('Select up to (19) items')
        } else {
            setSearchButtonText(`Select up to (${20 - selectedItems.length}) items`)
        }
        

        setSelectedItems(items)
    }

    const searchPrices = async (e) => {
        e.preventDefault()

        console.log(items.filter(((_, i) => selectedItems.includes(i))).map((({productId}) => productId)))

        const { data } = await axios.post('/api/search/prices', {
            guestApiToken,
            productIds: items.filter(((_, i) => selectedItems.includes(i))).map((({productId}) => productId))
        })

        console.log(data)
    }
    

    useEffect(() => {
        if (!isRegistered) register()
    })
    
    return (
        <div id="container">
            <div id="border-shadow-wrapper">
                <fieldset disabled={searchInputDisabled}>
                    <form id="search" onSubmit={searchItems}>
                        <input type="text" placeholder="Search For A Product" value={query} onChange={(e) => setQuery(e.target.value)}/>
                        <button id="search-icon" type="submit"/>
                    </form>
                </fieldset>
            </div>
                {
                    items.length > 0 &&
                    <>
                        <div id="search-results-box">
                            {
                                items.map(({name, retailerId, productId, image}, i) =>
                                    <SearchItem
                                        onClick={(selected) => handleSelectItem(selected, i)}
                                        disabled={selectDisabled}
                                        key={productId + i}
                                        name={name}
                                        store={retailers.find(({id}) => retailerId === id)}
                                        image={image}
                                    />)
                            }
                        </div>
                        <button
                            id="search-button"
                            disabled={searchButtonDisabled}
                            onClick={searchPrices}>
                                {searchButtonText}
                        </button>
                    </>
                }
                {
                    prices.length > 0 &&
                        <div id="price-results-box">
                            {
                                prices
                                    .sort((a, b) => a.price - b.price)
                                    .map(({name, retailerId, image, price, rank}) => {
                                        <PriceItem
                                            key={name + retailerId + image + price + rank}
                                            name={name}
                                            store={retailers.find(({id}) => retailerId === id)}
                                            image={image}
                                            price={price}
                                            rank={rank}
                                        />
                                    })
                            }
                        </div>
                }
        </div>
    )
}