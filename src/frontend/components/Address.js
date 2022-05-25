export default function Address(props) {    
    const { address, setAddress, setPostalcode, setHasValidAddress } = props
    
    return (
        <div id="container">
            <div id="address">
                <input type="text" placeholder="Enter Your Address" value={address} onChange={(e) => setAddress(e.target.value)}/>
                <button id="address-icon" type="submit" disabled={true}/>
            </div>
        </div>
    )
}