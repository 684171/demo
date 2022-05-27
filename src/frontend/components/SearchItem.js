export default function SearchItem(props) {
    const { name, store, image } = props

    return (
        <div id="search-result-wrapper">
            <button id="search-result-option">
                <img src={image}/>
                <div id="search-result-data">
                    <a href={'https://www.instacart.ca/' + store.slug}>
                        <div id="store">{store.name}</div>
                    </a>
                    <div id="name">{name}</div>
                </div>
            </button>
        </div>
    )
}