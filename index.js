const request = require('request')
const zlib = require('zlib')
const { v4: uuidv4 } = require('uuid')
class Demo {
    constructor() {
        // Class constants
        this.USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/101.0.4951.67 Safari/537.36'
    }

    /**
     * Decodes brotli encoding, not automatically done so by the request library
     * 
     * @param {string} data - UTF-8 encoded data to be decoded
     */
    decodeBrotliEncoding = (input) => {
        try {
            // Convert data to utf-8
            const data = Buffer.from(input, 'utf-8')

            // Use zlib to decompress brotli
            const decoded = zlib.brotliDecompressSync(data)

            // Convert and return decoded buffer
            return decoded.toString('utf-8')
        } catch (err) {
            return err
        }
    }

    /**
     * Signs up a homepage guest user
     * 
     * @param {Object} args
     * @param {string} postalCode - Postal code to get register API token
     * @param {string} address - Address to register API token
     * 
     * @returns {string} The guest API token
     */
    signupHomepageGuestUser = ({postalCode, address}) =>
        new Promise((resolve, reject) => {
            try {
                // API parameters
                const data = {
                    operationName: "HomepageGuestUser",
                    variables: {
                        "postalCode": postalCode,
                        "streetAddress": address
                    },
                    extensions: {
                        "persistedQuery": {
                            "version": 1,
                            "sha256Hash": "3396660a30136599b441f3408b39212806a2515d345e235e1b4dc2e9e69ff806"
                        }
                    }
                }

                // Build request
                request({
                    url: `https://www.instacart.ca/graphql`,
                    method: 'POST',
                    headers: {
                        'accept': '*/*',
                        'accept-encoding': 'gzip, deflate, br',
                        'accept-language': 'en-US,en;q=0.9',
                        'cache-control': 'no-cache',
                        'content-type': 'application/json',
                        'origin': 'https://www.instacart.ca',
                        'pragma': 'no-cache',
                        'referer': 'https://www.instacart.ca/',
                        'sec-ch-ua': '" Not A;Brand";v="99", "Chromium";v="101", "Google Chrome";v="101"',
                        'sec-ch-ua-mobile': '?0',
                        'sec-ch-ua-platform': '"Windows"',
                        'sec-fetch-dest': 'empty',
                        'sec-fetch-mode': 'cors',
                        'sec-fetch-site': 'same-origin',
                        'user-agent': this.USER_AGENT,
                        'x-client-identifier': 'web'
                    },
                    body: JSON.stringify(data),
                    encoding: null
                }, (err, res) => {
                    try {
                        if (err) throw new Error(err);
                        else {
                            if (res.statusCode === 200) {
                                // Decode encoding if brotli
                                if (res.headers['content-encoding'] === 'br') res.body = this.decodeBrotliEncoding(res.body)

                                // Parse response body JSON
                                const parsedJSON = JSON.parse(res.body)

                                // Set guest api token to be used for subsequent authenticated API requests
                                const guestApiToken = parsedJSON.data.createGuestUserWithAddress.token

                                return resolve(guestApiToken)
                            } else throw new Error('Unexpected API response status code:', statusCode)
                        }
                    } catch (err) {
                        console.error(err)
                        return reject(err)
                    }
                })
            } catch (err) {
                console.error(err)
                return reject(err)
            }
        })

    /**
     * Gets available retailers from Instacart API, used to derive products from available stores
     * 
     * @param {Object} args
     * @param {string} postalCode - Postal code to get relative available store ids
     * @param {string} guestApiToken - API token derived from registering as a homepage guest user
     * 
     * @returns {Array.<{id: string, name: string, slug: string, type: string}>} Available retailers
     */
    getAvailableRetailServices = ({postalCode, guestApiToken}) =>
        new Promise((resolve, reject) => {
            try {
                // API parameters
                const data = new URLSearchParams({
                    operationName: "AvailableRetailerServices",
                    variables: JSON.stringify({
                        "postalCode": postalCode,
                    }),
                    extensions: JSON.stringify({
                        "persistedQuery": {
                            "version": 1,
                            "sha256Hash": "281e876a4bc1aedc1d369cf730d9e4141bd7339c92b9c18d5fde7783134702c5"
                        }
                    })
                })

                // Build request
                request({
                    url: `https://www.instacart.ca/graphql?${data.toString()}`,
                    method: 'GET',
                    headers: {
                        'accept': '*/*',
                        'accept-encoding': 'gzip, deflate, br',
                        'accept-language': 'en-US,en;q=0.9',
                        'cache-control': 'no-cache',
                        'content-type': 'application/json',
                        'pragma': 'no-cache',
                        'referer': 'https://www.instacart.ca/store/s',
                        'sec-ch-ua': '" Not A;Brand";v="99", "Chromium";v="101", "Google Chrome";v="101"',
                        'sec-ch-ua-mobile': '?0',
                        'sec-ch-ua-platform': '"Windows"',
                        'sec-fetch-dest': 'empty',
                        'sec-fetch-mode': 'cors',
                        'sec-fetch-site': 'same-origin',
                        'user-agent': this.USER_AGENT,
                        'x-client-identifier': 'web',
                        'cookie': `__Host-instacart_sid=${guestApiToken}` // API auth cookie
                    },
                    encoding: null
                }, (err, res) => {
                    try {
                        if (err) throw new Error(err);
                        else {
                            if (res.statusCode === 200) {
                                // Decode encoding if brotli
                                if (res.headers['content-encoding'] === 'br') res.body = this.decodeBrotliEncoding(res.body)

                                // Parse response body JSON
                                const parsedJSON = JSON.parse(res.body)

                                // Map response to array of non-alcohol available retailer ids
                                const retailers = parsedJSON.data.availableRetailerServices
                                    .filter(({
                                        retailer
                                    }) => retailer.type !== 'Alcohol')
                                    .map(({
                                        retailer
                                    }) => ({
                                        id: retailer.id,
                                        name: retailer.name,
                                        slug: retailer.slug,
                                        type: retailer.retailerType
                                    }))

                                return resolve(retailers)
                            } else throw new Error('Unexpected API response status code:', statusCode)
                        }
                    } catch (err) {
                        console.error(err)
                        return reject(err)
                    }
                })
            } catch (err) {
                console.error(err)
                return reject(err)
            }
        })

    /**
     * Gets stores matching a search query
     * 
     * @param {Object} args
     * @param {string} postalCode - Postal code to search
     * @param {string} guestApiToken - API token derived from registering as a homepage guest user
     * @param {Array.<{id: string, name: string, slug: string, type: string}>} retailers - List of retailers to search
     * @param {string} query - Query to search
     * 
     * @returns {Array.<{id: string, name: string, slug: string, type: string}>} Retailers matching search query
     */
    getStoresFromSearch = ({postalCode, guestApiToken, retailers, query}) =>
        new Promise((resolve, reject) => {
            try {
                // API parameters
                const data = new URLSearchParams({
                    operationName: "CrossRetailerSearchV2",
                    variables: JSON.stringify({
                        "overrideFeatureStates": [],
                        "query": query,
                        "zoneId": "709",
                        "postalCode": postalCode,
                        "alcoholRetailerIds": [],
                        "nonAlcoholRetailerIds": retailers.map(({id}) => id),
                        "pickupOnlyRetailerIds": [],
                        "pageViewId": uuidv4(),
                        "disableAutocorrect": false,
                        "includeDebugInfo": false
                    }),
                    extensions: JSON.stringify({
                        "persistedQuery": {
                            "version": 1,
                            "sha256Hash": "e68a32e923c4b9b6d84e8bd529b117563ab0da6c76d7068941f67044314e6f02"
                        }
                    })
                })

                // Build request
                request({
                    url: `https://www.instacart.ca/graphql?${data.toString()}`,
                    method: 'GET',
                    headers: {
                        'accept': '*/*',
                        'accept-encoding': 'gzip, deflate, br',
                        'accept-language': 'en-US,en;q=0.9',
                        'cache-control': 'no-cache',
                        'content-type': 'application/json',
                        'pragma': 'no-cache',
                        'referer': 'https://www.instacart.ca/store/s',
                        'sec-ch-ua': '" Not A;Brand";v="99", "Chromium";v="101", "Google Chrome";v="101"',
                        'sec-ch-ua-mobile': '?0',
                        'sec-ch-ua-platform': '"Windows"',
                        'sec-fetch-dest': 'empty',
                        'sec-fetch-mode': 'cors',
                        'sec-fetch-site': 'same-origin',
                        'user-agent': this.USER_AGENT,
                        'x-client-identifier': 'web',
                        'cookie': `__Host-instacart_sid=${guestApiToken}` // API auth cookie
                    },
                    encoding: null
                }, (err, res) => {
                    try {
                        if (err) throw new Error(err);
                        else {
                            if (res.statusCode === 200) {
                                // Decode encoding if brotli
                                if (res.headers['content-encoding'] === 'br') res.body = this.decodeBrotliEncoding(res.body)

                                // Parse response body JSON
                                const parsedJSON = JSON.parse(res.body)

                                const products = parsedJSON.data.searchCrossRetailerResultsV2.retailerProducts.map(({
                                    name,
                                    retailerId,
                                    productId,
                                    viewSection: {
                                        retailerProductImage: {
                                            url: image
                                        }
                                    }
                                }) => ({
                                    name,
                                    retailerId,
                                    productId,
                                    image
                                }))

                                return resolve(products)
                            } else throw new Error('Unexpected API response status code:', statusCode)
                        }
                    } catch (err) {
                        console.error(err)
                        return reject(err)
                    }
                })
            } catch (err) {
                console.error(err)
                return reject(err)
            }
        })

}

const main = async () => {
    const demo = new Demo({
        postalCode: 'M5R2A9',
        address: '1233 Bay Street'
    });

    const postalCode = 'M5R2A9'
    const address = '1233 Bay Street'
    const query = 'potatoe'

    const guestApiToken = await demo.signupHomepageGuestUser({postalCode, address})
    const retailers = await demo.getAvailableRetailServices({postalCode, guestApiToken})
    const products = await demo.getStoresFromSearch({postalCode, guestApiToken, retailers, query})

    console.log(products)
}

main();