import axios from 'axios'
import { useState, useEffect } from 'react'
import AddressAutocomplete from './AddressAutocomplete'
import { v4 as uuidv4 } from 'uuid';

export default function Address(props) {    
    const { address, setAddress, setPostalCode, setHasValidAddress } = props
    const [autocompletes, setAutocompletes] = useState([])
    const [inputDisabled, setInputDisabled] = useState(false)

    const getAutocompleteAddresses = async () => {
        if (address.length <= 1) {
            setAutocompletes([])
            return
        }

        const params = {
            operationName: 'AddressModalAutoCompleteLocations',
            variables: {
                query: address
            },
            extensions: {
                persistedQuery: {
                    version: 1,
                    sha256Hash: "c0c5156ea46d3134127c0a0fe9e4feef1b7956630fb91911f041350a8aefcced"
                }
            }
        }
    
        const { data } = await axios.get('https://www.instacart.ca/graphql', {params})
                
        const autocompletes = data.data.autocompleteLocations.locations.map(({
            postalCode,
            viewSection
        }) => ({
            lineOne: viewSection.lineOneString,
            lineTwo: viewSection.lineTwoString,
            postalCode
        }))

        setAutocompletes(autocompletes)
    }

    useEffect(() => {
        getAutocompleteAddresses()
    }, [address])

    const onAutocompleteAddressClick = (address, postalCode) => {
        setInputDisabled(true)
        setAddress(address)
        setPostalCode(postalCode)
        setHasValidAddress(true)
    }

    return (
        <div id="container">
            <div id="shadow">
                <div id="address">
                    <input type="text" disabled={inputDisabled} placeholder="Enter Your Address" value={address} onChange={(e) => setAddress(e.target.value)}/>
                    <button id="address-icon" type="submit" disabled={true}/>
                </div>
                {
                    autocompletes &&
                        <div id="autocomplete-address">
                        <div id="autocomplete-address-box">
                            {
                                autocompletes.map(({lineOne, lineTwo, postalCode}) => 
                                    <AddressAutocomplete
                                        key={uuidv4()}
                                        onClick={() => onAutocompleteAddressClick(lineOne, postalCode)}
                                        lineOne={lineOne}
                                        lineTwo={lineTwo}
                                        postalCode={postalCode}
                                    />
                                )
                            }
                        </div>
                    </div>
                }
            </div>
        </div>
    )
}