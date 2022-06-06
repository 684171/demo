import { useState } from 'react'

export default function SearchItem(props) {
    const { name, store, image, onClick} = props
    const [selected, setSelected] = useState(false)

    const handleClick = () => {
        setSelected(!selected)
        onClick(selected)
    }

    return (
        <button id="search-result-option" className={selected && 'selected'} onClick={handleClick}>
            <div id="store">{store.name}</div>
            <img src={image}/>
            <div id="name">{name}</div>
        </button>
    )
}