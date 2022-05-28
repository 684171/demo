const request = require('request')
const zlib = require('zlib')
const { v4: uuidv4 } = require('uuid')
const cheerio = require('cheerio')

class Instacart {
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
     * @param {string} args.postalCode - Postal code to get register API token
     * @param {string} args.address - Address to register API token
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
                            } else throw new Error('Unexpected API response status code: ' + res.statusCode)
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
     * Derives a zone id from a guestApiToken
     * 
     * @param {Object} args
     * @param {string} args.guestApiToken - API token derived from registering as a homepage guest user
     * 
     * @returns {string} The zone id
     */
    getZoneId = ({guestApiToken}) =>
        new Promise((resolve, reject) => {
            try {
                // Build request
                request({
                    url: `https://www.instacart.ca/store`,
                    method: 'GET',
                    headers: {
                        'accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9',
                        'accept-encoding': 'gzip, deflate, br',
                        'accept-language': 'en-US,en;q=0.9',
                        'cache-control': 'no-cache',
                        'pragma': 'no-cache',
                        'referer': 'https://www.instacart.ca/',
                        'sec-ch-ua': '" Not A;Brand";v="99", "Chromium";v="102", "Google Chrome";v="102"',
                        'sec-ch-ua-mobile': '?0',
                        'sec-ch-ua-platform': '"Windows"',
                        'sec-fetch-dest': 'document',
                        'sec-fetch-mode': 'navigate',
                        'sec-fetch-site': 'same-origin',
                        'sec-fetch-user': '?1',
                        'upgrade-insecure-requests': '1',
                        'user-agent': this.USER_AGENT,
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

                            // Extract url encoded JSON from HTML response where the zoneId is kept
                            const $ = cheerio.load(res.body)
                            const nodeApolloState = JSON.parse(decodeURIComponent($('#node-apollo-state').text()))

                            const zoneId = nodeApolloState.ROOT_QUERY.lastUserLocation.zoneId
                        
                            return resolve(zoneId)
                            } else throw new Error('Unexpected API response status code: ' + res.statusCode)
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
     * @param {string} args.postalCode - Postal code to get relative available store ids
     * @param {string} args.guestApiToken - API token derived from registering as a homepage guest user
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

                                // Map response to trimmed non-alcohol available retailer ids
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
                            } else throw new Error('Unexpected API response status code: ' + res.statusCode)
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
     * Gets products matching a search query
     * 
     * @param {Object} args
     * @param {string} args.postalCode - Postal code to search
     * @param {string} args.guestApiToken - API token derived from registering as a homepage guest user
     * @param {string} args.zoneId - Zone id derived from guestApiToken
     * @param {Array.<{id: string, name: string, slug: string, type: string}>} args.retailers - List of retailers to search
     * @param {string} args.query - Query to search
     * 
     * @returns {{showingResultsForString: string, products: Array.<{name: string, retailerId: string, productId: string, image: string}>}} - Products matching search & showing results for string
     */
     getProductsMatchingSearch = ({postalCode, guestApiToken, zoneId, retailers, query}) =>
        new Promise((resolve, reject) => {
            try {
                // API parameters
                const data = new URLSearchParams({
                    operationName: "CrossRetailerSearchV2",
                    variables: JSON.stringify({
                        "overrideFeatureStates": [],
                        "query": query,
                        "zoneId": zoneId,
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

                                // Map response to trimmed product data
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

                                return resolve({
                                    showingResultsForString: parsedJSON.data?.searchCrossRetailerResultsV2?.viewSection?.reformulation?.showingResultsForString,
                                    products
                                })
                            } else throw new Error('Unexpected API response status code: ' + res.statusCode)
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
     * Gets up to 20 products' data
     * 
     * @param {Object} args
     * @param {String[]} args.productIds - Array of product ids to derive data
     * @param {string} args.guestApiToken - API token derived from registering as a homepage guest user
     */
    getProductData = ({productIds, guestApiToken}) =>
        new Promise((resolve, reject) => {
            try {
                // API parameters
                const data = new URLSearchParams({
                    override_retailer_available_flag: true,
                    source: 'web'
                })

                const parsedProductIds = productIds.map(productId => `item_${productId}`).join(',')

                // Build request
                request({
                    url: `https://www.instacart.ca/v3/view/item_attributes/${parsedProductIds}?${data.toString()}`,
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

                                return resolve(parsedJSON.view)
                            } else throw new Error('Unexpected API response status code: '+  res.statusCode)
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

    register = async ({postalCode, address}) => {
        const guestApiToken = await this.signupHomepageGuestUser({postalCode, address})
        const zoneId = await this.getZoneId({guestApiToken})
        const retailers = await this.getAvailableRetailServices({postalCode, guestApiToken})
        
        return {guestApiToken, zoneId, retailers}
    }

    searchItems = async ({postalCode, guestApiToken, zoneId, retailers, query}) => {
        const searchResult = await this.getProductsMatchingSearch({postalCode, guestApiToken, zoneId, retailers, query})

        return searchResult
    }

    searchPrices = async ({productIds, guestApiToken}) => {
        const productData = await this.getProductData({productIds, guestApiToken})

        return productData
    }

}

module.exports = Instacart