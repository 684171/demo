const request = require('request')
const zlib = require('zlib')

class Demo {
    constructor({postalCode, address}) {
        // Input defined, constant value variables
        this.postalCode = postalCode
        this.address = address

        // Class constants
        this.USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/101.0.4951.67 Safari/537.36'
        
        // Class defined, dynamic value variables
        this.guestApiToken = undefined
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
     */
    signupHomepageGuestUser = () =>
        new Promise((resolve, reject) => {
            try {
                // API parameters
                const data = {
                    operationName: "HomepageGuestUser",
                    variables: {
                        "postalCode": this.postalCode,
                        "streetAddress": this.address
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
                                this.guestApiToken = parsedJSON.data.createGuestUserWithAddress.token

                                return resolve()
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
     * Gets available store ids from Instacart API, used to derive products from available stores
     */
    getAvailableRetailServices = () =>
        new Promise((resolve, reject) => {
            try {
                // API parameters
                const data = new URLSearchParams({
                    operationName: "AvailableRetailerServices",
                    variables: JSON.stringify({
                        "postalCode": this.postalCode,
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
                        'cookie': `__Host-instacart_sid=${this.guestApiToken}` // API auth cookie
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

                                // Map response to array of available retailer ids
                                const retailerIds = parsedJSON.data.availableRetailerServices.map(service => service.retailerId)

                                return resolve(retailerIds)
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
    const demo = new Demo({postalCode: 'M5R2A9', address: '1233 Bay Street'});

    // M5R2A9
    // 1233 Bay Street
    await demo.signupHomepageGuestUser()
    const data = await demo.getAvailableRetailServices()

    console.log(data)
}

main();