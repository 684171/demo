export default function SearchItem(props) {
    const { name, store, image } = props

    return (
        <button id="search-result-option">
            <div id="store">{store.name}</div>
            <img src={image}/>
            <div id="name">{name}</div>
        </button>
    )
}