import { useState } from 'react'
import { Address, Search } from '../components'

export default function Frugle() {
    const [query, setQuery] = useState('')
    const [address, setAddress] = useState('')
    const [postalCode, setPostalCode] = useState('')
    const [hasValidAddress, setHasValidAddress] = useState(false);

    return (
        <div id="frugle">
            <div id="title">Frugle</div>
               {
                   !hasValidAddress
                    ? <Search query={query} setQuery={setQuery}/>
                    : <Address
                        address={address}
                        setAddress={setAddress}
                        setPostalCode={setPostalCode}
                        setHasValidAddress={setHasValidAddress}
                       />
               }
        </div>
    )
}
