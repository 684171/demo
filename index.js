const request = require('request');

// operationName: AvailableRetailerServices
// variables: {"postalCode":"L1S6B8","addressId":"398664835","coordinates":{"latitude":43.8542057,"longitude":-79.0536002}}
// extensions: {"persistedQuery":{"version":1,"sha256Hash":"281e876a4bc1aedc1d369cf730d9e4141bd7339c92b9c18d5fde7783134702c5"}}

class Demo {
    constructor() {}

    test() {

        const data = new URLSearchParams({
            operationName: 'CrossRetailerSearchV2',
            variables: JSON.stringify({
                "overrideFeatureStates": [],
                "query": "potatoe",
                "zoneId": "759",
                "postalCode": "L1S6B8",
                "alcoholRetailerIds": ["1646"],
                "nonAlcoholRetailerIds": ["1900", "2127", "2138", "311", "351", "354", "443", "462", "523", "534", "536", "551", "610", "635", "1256", "1473", "1509", "1543", "1555", "1603", "1609", "1610", "1634", "1671", "1702", "1721", "1765", "1898", "1928", "2044", "2081"],
                "pickupOnlyRetailerIds": [],
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

        request({
            url: `https://www.instacart.ca/graphql?${data.toString()}`
        }, (err, res) => {
            console.error(err);
            console.log(res.body);
        })
    }
}

const main = () => {
    const demo = new Demo();

    demo.test();
}

main();