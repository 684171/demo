export default function PriceItem(props) {
    const { name, store, image, price, rank } = props

    return (
        <button id="price-result-option">
            <div id="store">{store.name}</div>
            <img src={image}/>
            <div id="name">{name}</div>
            <div id="price">{price}</div>
            <div id="rank" rank={rank}>{rank}</div>
        </button>
    )
}